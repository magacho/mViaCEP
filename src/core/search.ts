// Framework-agnostic ViaCEP reverse address search.
//
// No React/Vue/Angular/DOM imports allowed here (see CLAUDE.md). This module
// mirrors the shape and behavior of `client.ts` (timeout via AbortController,
// NetworkError wrapping, non-2xx handling, raw → Address mapping) so the two
// functions feel consistent. It relies on the global `fetch` and
// `AbortController`, both available in Node 24 and modern browsers.
//
// Unlike `lookup`, the reverse endpoint returns a JSON ARRAY of addresses
// (possibly empty). An empty array is a VALID result — reverse search
// legitimately returns zero matches — so it resolves to `[]` rather than a
// NotFoundError.

import { InvalidCepError, NetworkError } from "./errors";
import type { Address, ViaCepRawResponse } from "./types";

/** Base URL of the ViaCEP JSON endpoint. */
const VIACEP_BASE_URL = "https://viacep.com.br/ws";

/** Default request timeout, in milliseconds. Matches `lookup`. */
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Minimum length ViaCEP requires for the `cidade` and `logradouro` segments of
 * a reverse query. Anything shorter is rejected before any network call.
 */
const MIN_SEGMENT_LENGTH = 3;

/** Options accepted by {@link search}. */
export interface SearchOptions {
  /** Abort the request after this many milliseconds. Defaults to 8000. */
  timeoutMs?: number;
  /** External {@link AbortSignal}; aborting it aborts the in-flight request. */
  signal?: AbortSignal;
}

/** Matches a valid UF: exactly two ASCII letters. */
const UF_PATTERN = /^[A-Za-z]{2}$/;

/** Maps a single raw ViaCEP entry to the normalized {@link Address}. */
function toAddress(raw: ViaCepRawResponse): Address {
  return {
    cep: raw.cep ?? "",
    logradouro: raw.logradouro ?? "",
    complemento: raw.complemento ?? "",
    unidade: raw.unidade ?? "",
    bairro: raw.bairro ?? "",
    localidade: raw.localidade ?? "",
    uf: raw.uf ?? "",
    estado: raw.estado ?? "",
    regiao: raw.regiao ?? "",
    ibge: raw.ibge ?? "",
    gia: raw.gia ?? "",
    ddd: raw.ddd ?? "",
    siafi: raw.siafi ?? "",
  };
}

/**
 * Reverse-searches Brazilian addresses by UF, city, and street through the
 * ViaCEP API endpoint `https://viacep.com.br/ws/{UF}/{cidade}/{logradouro}/json/`.
 *
 * Flow:
 * 1. Trim inputs and validate: `uf` must be exactly 2 letters, and both
 *    `cidade` and `logradouro` must be at least 3 characters. On invalid input
 *    reject with {@link InvalidCepError} (reused as this module's validation
 *    error to avoid inventing a new error class); fetch is never called.
 * 2. URL-encode each path segment with `encodeURIComponent`, since city and
 *    street names contain spaces and accents.
 * 3. `fetch` the endpoint with a timeout enforced via {@link AbortController}.
 * 4. A non-2xx status, a network failure, or a timeout rejects with
 *    {@link NetworkError} (the underlying cause is preserved).
 * 5. A JSON array is mapped to `Address[]`. An empty array resolves to `[]`
 *    (NOT a NotFoundError) — reverse search legitimately returns zero matches.
 * 6. ViaCEP occasionally answers malformed reverse queries with `{ erro: true }`
 *    instead of an array. That shape is treated as "no matches" and resolves to
 *    `[]`, keeping the success contract as "always an array".
 *
 * @param uf Two-letter Unidade Federativa (e.g. `"SP"`). Case-insensitive.
 * @param cidade City / municipality name (min 3 chars).
 * @param logradouro Street name (min 3 chars).
 * @param options See {@link SearchOptions}.
 */
export async function search(
  uf: string,
  cidade: string,
  logradouro: string,
  options: SearchOptions = {},
): Promise<Address[]> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;

  const ufTrimmed = uf.trim();
  const cidadeTrimmed = cidade.trim();
  const logradouroTrimmed = logradouro.trim();

  if (
    !UF_PATTERN.test(ufTrimmed) ||
    cidadeTrimmed.length < MIN_SEGMENT_LENGTH ||
    logradouroTrimmed.length < MIN_SEGMENT_LENGTH
  ) {
    throw new InvalidCepError(
      `${ufTrimmed}/${cidadeTrimmed}/${logradouroTrimmed}`,
    );
  }

  const url =
    `${VIACEP_BASE_URL}/${encodeURIComponent(ufTrimmed.toUpperCase())}` +
    `/${encodeURIComponent(cidadeTrimmed)}` +
    `/${encodeURIComponent(logradouroTrimmed)}/json/`;

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      throw new NetworkError(
        `Reverse search "${url}" was aborted before it started.`,
        signal.reason,
      );
    }
    signal.addEventListener("abort", onExternalAbort);
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (cause) {
    throw new NetworkError(
      `Failed to reach ViaCEP for reverse search "${url}" (timeout ${timeoutMs}ms or network error).`,
      cause,
    );
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", onExternalAbort);
    }
  }

  if (!response.ok) {
    throw new NetworkError(
      `ViaCEP returned HTTP ${response.status} for reverse search "${url}".`,
    );
  }

  let body: ViaCepRawResponse[] | ViaCepRawResponse;
  try {
    body = (await response.json()) as ViaCepRawResponse[] | ViaCepRawResponse;
  } catch (cause) {
    throw new NetworkError(
      `Failed to parse ViaCEP response for reverse search "${url}".`,
      cause,
    );
  }

  // The happy path is a JSON array. ViaCEP sometimes answers malformed reverse
  // queries with a `{ erro: true }` object instead — treat any non-array shape
  // as "no matches" so the success contract stays "always an array".
  if (!Array.isArray(body)) {
    return [];
  }

  return body.map(toAddress);
}
