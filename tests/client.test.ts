import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  lookup,
  createMemoryCache,
  createSessionStorageCache,
} from "../src/core/client";
import type { CacheLike } from "../src/core/client";
import {
  InvalidCepError,
  NotFoundError,
  NetworkError,
} from "../src/core/errors";
import type { Address, ViaCepRawResponse } from "../src/core/types";

// A complete, well-formed ViaCEP success body for CEP 01001-000.
const RAW_OK: ViaCepRawResponse = {
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
};

const EXPECTED_ADDRESS: Address = {
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
};

/** Builds a Response-like object good enough for the client. */
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

describe("lookup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("(a) resolves a valid CEP to a mapped Address and calls the correct URL", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(jsonResponse(RAW_OK));

    const address = await lookup("01001-000", { cache: createMemoryCache() });

    expect(address).toEqual(EXPECTED_ADDRESS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toBe("https://viacep.com.br/ws/01001000/json/");
  });

  it("(b1) rejects with NotFoundError when body is { erro: true } (boolean)", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ erro: true }));

    await expect(
      lookup("99999999", { cache: createMemoryCache() }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('(b2) rejects with NotFoundError when body is { erro: "true" } (string)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ erro: "true" }));

    await expect(
      lookup("99999999", { cache: createMemoryCache() }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("(c) rejects malformed CEP with InvalidCepError and does NOT call fetch", async () => {
    const fetchMock = vi.mocked(fetch);

    await expect(lookup("123", { cache: createMemoryCache() })).rejects.toBeInstanceOf(
      InvalidCepError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("(d1) rejects with NetworkError when fetch rejects (network failure)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("connection refused"));

    const err = await lookup("01001000", { cache: createMemoryCache() }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).cause).toBeInstanceOf(Error);
  });

  it("(d2) rejects with NetworkError on timeout (AbortController fires)", async () => {
    // fetch that only settles by rejecting when its signal aborts.
    vi.mocked(fetch).mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = (init as RequestInit | undefined)?.signal;
        signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    await expect(
      lookup("01001000", { timeoutMs: 10, cache: createMemoryCache() }),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it("(e) rejects with NetworkError on non-2xx HTTP status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse("Service Unavailable", { status: 503 }),
    );

    await expect(
      lookup("01001000", { cache: createMemoryCache() }),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it("(f) cache hit avoids a second fetch for the same normalized CEP", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_OK));
    const cache = createMemoryCache();

    const first = await lookup("01001-000", { cache });
    // Different formatting, same normalized CEP → must hit cache.
    const second = await lookup("01001000", { cache });

    expect(first).toEqual(EXPECTED_ADDRESS);
    expect(second).toEqual(EXPECTED_ADDRESS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not cache a not-found result (each lookup re-fetches)", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(jsonResponse({ erro: true }));
    const cache = createMemoryCache();

    await expect(lookup("99999999", { cache })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(lookup("99999999", { cache })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aborts immediately when an already-aborted external signal is passed", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_OK));
    const controller = new AbortController();
    controller.abort();

    await expect(
      lookup("01001000", {
        signal: controller.signal,
        cache: createMemoryCache(),
      }),
    ).rejects.toBeInstanceOf(NetworkError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the module-level default cache when no cache option is given", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_OK));

    // A CEP unlikely to collide with other tests, exercised twice.
    await lookup("12345678");
    await lookup("12345-678");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("createMemoryCache", () => {
  it("stores and retrieves by key, returns undefined for a miss", () => {
    const cache = createMemoryCache();
    expect(cache.get("k")).toBeUndefined();
    cache.set("k", EXPECTED_ADDRESS);
    expect(cache.get("k")).toEqual(EXPECTED_ADDRESS);
  });

  it("isolates separate cache instances", () => {
    const a = createMemoryCache();
    const b = createMemoryCache();
    a.set("k", EXPECTED_ADDRESS);
    expect(b.get("k")).toBeUndefined();
  });
});

describe("createSessionStorageCache", () => {
  it("round-trips an Address through sessionStorage (jsdom)", () => {
    const cache = createSessionStorageCache("test-ns");
    expect(cache.get("01001000")).toBeUndefined();
    cache.set("01001000", EXPECTED_ADDRESS);
    expect(cache.get("01001000")).toEqual(EXPECTED_ADDRESS);
  });

  it("does not crash when sessionStorage is unavailable (Node-like env)", () => {
    const original = globalThis.sessionStorage;
    // Simulate an environment without sessionStorage.
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
    try {
      const cache: CacheLike = createSessionStorageCache();
      expect(() => cache.set("k", EXPECTED_ADDRESS)).not.toThrow();
      expect(cache.get("k")).toBeUndefined();
    } finally {
      (globalThis as { sessionStorage?: Storage }).sessionStorage = original;
    }
  });
});
