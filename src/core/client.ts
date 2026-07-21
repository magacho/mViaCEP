// Framework-agnostic ViaCEP lookup client — the heart of mViaCEP.
//
// No React/Vue/Angular/DOM imports allowed here (see CLAUDE.md). This module
// only fetches, validates, maps, and caches. It relies on the global `fetch`
// and `AbortController`, both available in Node 24 and modern browsers.

import { normalize, isValid } from "./cep";
import { InvalidCepError, NotFoundError, NetworkError } from "./errors";
import type { Address, ViaCepRawResponse } from "./types";

/** Base URL of the ViaCEP JSON endpoint. */
const VIACEP_BASE_URL = "https://viacep.com.br/ws";

/** Default request timeout, in milliseconds. */
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Minimal cache contract used by {@link lookup}.
 *
 * Kept intentionally tiny (synchronous `get`/`set`) so that any backing store —
 * an in-memory `Map`, `sessionStorage`, or a consumer-supplied implementation —
 * can satisfy it. Keys are always the *normalized* CEP (8 digits), so
 * `01001000`, `01001-000`, and `"01001-000 "` share a single entry.
 */
export interface CacheLike {
  /** Returns the cached {@link Address} for `key`, or `undefined` on a miss. */
  get(key: string): Address | undefined;
  /** Stores `value` under `key`. */
  set(key: string, value: Address): void;
}

/** Options accepted by {@link lookup}. */
export interface LookupOptions {
  /** Abort the request after this many milliseconds. Defaults to 8000. */
  timeoutMs?: number;
  /** Cache to consult/populate. Defaults to a shared module-level in-memory cache. */
  cache?: CacheLike;
  /** External {@link AbortSignal}; aborting it aborts the in-flight request. */
  signal?: AbortSignal;
}

/**
 * Creates a fresh in-memory cache backed by a `Map`.
 *
 * Each call returns an isolated instance — useful for tests or for scoping a
 * cache to a single client/session.
 */
export function createMemoryCache(): CacheLike {
  const store = new Map<string, Address>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
  };
}

/**
 * Creates a cache backed by `sessionStorage`, guarded for environments where it
 * is unavailable (e.g. Node, SSR, or privacy modes that throw on access).
 *
 * When `sessionStorage` cannot be used, the returned cache degrades gracefully
 * to a no-op that never throws: `get` always misses and `set` silently does
 * nothing. Entries are namespaced to avoid clashing with other stored keys.
 *
 * @param namespace Prefix for stored keys. Defaults to `"mviacep"`.
 */
export function createSessionStorageCache(namespace = "mviacep"): CacheLike {
  const prefix = `${namespace}:`;

  function getStorage(): Storage | undefined {
    try {
      const storage = (globalThis as { sessionStorage?: Storage })
        .sessionStorage;
      return storage ?? undefined;
    } catch {
      // Accessing sessionStorage can throw (e.g. sandboxed iframes).
      return undefined;
    }
  }

  return {
    get: (key) => {
      const storage = getStorage();
      if (!storage) return undefined;
      try {
        const raw = storage.getItem(prefix + key);
        return raw ? (JSON.parse(raw) as Address) : undefined;
      } catch {
        return undefined;
      }
    },
    set: (key, value) => {
      const storage = getStorage();
      if (!storage) return;
      try {
        storage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Quota errors / disabled storage must never break a lookup.
      }
    },
  };
}

/** Shared default cache used when the caller does not supply one. */
const defaultCache: CacheLike = createMemoryCache();

/**
 * Detects the ViaCEP "not found" sentinel.
 *
 * ViaCEP answers HTTP 200 with body `{ "erro": true }` for a well-formed CEP
 * that has no address. The flag may arrive as the boolean `true` OR the string
 * `"true"`, so both are treated as not-found.
 */
function isNotFoundBody(body: ViaCepRawResponse): boolean {
  return body.erro === true || body.erro === "true";
}

/** Maps a successful raw ViaCEP response to the normalized {@link Address}. */
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
 * Looks up a Brazilian address by CEP through the ViaCEP API.
 *
 * Flow:
 * 1. Normalize the input; reject with {@link InvalidCepError} if it is not a
 *    well-formed 8-digit CEP (fetch is never called in this case).
 * 2. On a cache hit (keyed by the normalized CEP), return the cached
 *    {@link Address} without touching the network.
 * 3. Otherwise `fetch` `https://viacep.com.br/ws/{cep}/json/` with a timeout
 *    enforced via {@link AbortController}.
 * 4. A non-2xx status, a network failure, or a timeout rejects with
 *    {@link NetworkError} (the underlying cause is preserved).
 * 5. A `{ erro: true }`/`{ erro: "true" }` body rejects with
 *    {@link NotFoundError}; not-found results are never cached.
 * 6. A successful response is mapped to {@link Address}, cached, and returned.
 *
 * @param cep Raw CEP string in any format (e.g. `"01001-000"`, `"01001000"`).
 * @param options See {@link LookupOptions}.
 */
export async function lookup(
  cep: string,
  options: LookupOptions = {},
): Promise<Address> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, cache = defaultCache, signal } =
    options;

  const normalized = normalize(cep);
  if (!isValid(cep)) {
    throw new InvalidCepError(cep);
  }

  const cached = cache.get(normalized);
  if (cached) {
    return cached;
  }

  const url = `${VIACEP_BASE_URL}/${normalized}/json/`;

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      throw new NetworkError(
        `Request for CEP "${normalized}" was aborted before it started.`,
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
      `Failed to reach ViaCEP for CEP "${normalized}" (timeout ${timeoutMs}ms or network error).`,
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
      `ViaCEP returned HTTP ${response.status} for CEP "${normalized}".`,
    );
  }

  let body: ViaCepRawResponse;
  try {
    body = (await response.json()) as ViaCepRawResponse;
  } catch (cause) {
    throw new NetworkError(
      `Failed to parse ViaCEP response for CEP "${normalized}".`,
      cause,
    );
  }

  if (isNotFoundBody(body)) {
    throw new NotFoundError(normalized);
  }

  const address = toAddress(body);
  cache.set(normalized, address);
  return address;
}
