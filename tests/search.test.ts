import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { search } from "../src/core/search";
import { InvalidCepError, NetworkError } from "../src/core/errors";
import type { Address, ViaCepRawResponse } from "../src/core/types";

// Two well-formed ViaCEP results for the reverse query
// SP / São Paulo / Praça da Sé.
const RAW_LIST: ViaCepRawResponse[] = [
  {
    cep: "01001-000",
    logradouro: "Praça da Sé",
    complemento: "lado ímpar",
    unidade: "",
    bairro: "Sé",
    localidade: "São Paulo",
    uf: "SP",
    estado: "São Paulo",
    regiao: "Sudeste",
    ibge: "3550308",
    gia: "1004",
    ddd: "11",
    siafi: "7107",
  },
  {
    cep: "01001-001",
    logradouro: "Praça da Sé",
    complemento: "lado par",
    unidade: "",
    bairro: "Sé",
    localidade: "São Paulo",
    uf: "SP",
    estado: "São Paulo",
    regiao: "Sudeste",
    ibge: "3550308",
    gia: "1004",
    ddd: "11",
    siafi: "7107",
  },
];

const EXPECTED_LIST: Address[] = [
  {
    cep: "01001-000",
    logradouro: "Praça da Sé",
    complemento: "lado ímpar",
    unidade: "",
    bairro: "Sé",
    localidade: "São Paulo",
    uf: "SP",
    estado: "São Paulo",
    regiao: "Sudeste",
    ibge: "3550308",
    gia: "1004",
    ddd: "11",
    siafi: "7107",
  },
  {
    cep: "01001-001",
    logradouro: "Praça da Sé",
    complemento: "lado par",
    unidade: "",
    bairro: "Sé",
    localidade: "São Paulo",
    uf: "SP",
    estado: "São Paulo",
    regiao: "Sudeste",
    ibge: "3550308",
    gia: "1004",
    ddd: "11",
    siafi: "7107",
  },
];

/** Builds a Response-like object good enough for the search client. */
function jsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): Response {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("search", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("(a) resolves a valid query to a mapped Address[] with more than one result", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_LIST));

    const results = await search("SP", "São Paulo", "Praça da Sé");

    expect(results).toEqual(EXPECTED_LIST);
    expect(results.length).toBeGreaterThan(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("(b) returns [] for an empty array result (not an error)", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse([]));

    const results = await search("SP", "São Paulo", "Rua Inexistente XYZ");

    expect(results).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("(c) treats a { erro: true } body as an empty result ([])", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ erro: true }));

    const results = await search("SP", "São Paulo", "Praça da Sé");

    expect(results).toEqual([]);
  });

  it("(d) URL-encodes each path segment (spaces and accents)", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_LIST));

    await search("SP", "São Paulo", "Praça da Sé");

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toBe(
      "https://viacep.com.br/ws/SP/S%C3%A3o%20Paulo/Pra%C3%A7a%20da%20S%C3%A9/json/",
    );
  });

  it("(e1) rejects a bad UF (not 2 letters) with InvalidCepError and does NOT call fetch", async () => {
    const fetchMock = vi.mocked(fetch);

    await expect(
      search("S", "São Paulo", "Praça da Sé"),
    ).rejects.toBeInstanceOf(InvalidCepError);
    await expect(
      search("SPP", "São Paulo", "Praça da Sé"),
    ).rejects.toBeInstanceOf(InvalidCepError);
    await expect(
      search("12", "São Paulo", "Praça da Sé"),
    ).rejects.toBeInstanceOf(InvalidCepError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("(e2) rejects a too-short cidade with InvalidCepError and does NOT call fetch", async () => {
    const fetchMock = vi.mocked(fetch);

    await expect(search("SP", "SP", "Praça da Sé")).rejects.toBeInstanceOf(
      InvalidCepError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("(e3) rejects a too-short logradouro with InvalidCepError and does NOT call fetch", async () => {
    const fetchMock = vi.mocked(fetch);

    await expect(search("SP", "São Paulo", "Sé")).rejects.toBeInstanceOf(
      InvalidCepError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("(f1) rejects with NetworkError when fetch rejects (network failure)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("connection refused"));

    const err = await search("SP", "São Paulo", "Praça da Sé").catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).cause).toBeInstanceOf(Error);
  });

  it("(f2) rejects with NetworkError on timeout (AbortController fires)", async () => {
    vi.mocked(fetch).mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = (init as RequestInit | undefined)?.signal;
        signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    await expect(
      search("SP", "São Paulo", "Praça da Sé", { timeoutMs: 10 }),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it("(g) rejects with NetworkError on non-2xx HTTP status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse("Service Unavailable", { status: 503 }),
    );

    await expect(
      search("SP", "São Paulo", "Praça da Sé"),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it("aborts immediately when an already-aborted external signal is passed", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_LIST));
    const controller = new AbortController();
    controller.abort();

    await expect(
      search("SP", "São Paulo", "Praça da Sé", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(NetworkError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims surrounding whitespace when validating and encoding segments", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_LIST));

    await search("  sp  ", "  São Paulo  ", "  Praça da Sé  ");

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toBe(
      "https://viacep.com.br/ws/SP/S%C3%A3o%20Paulo/Pra%C3%A7a%20da%20S%C3%A9/json/",
    );
  });
});
