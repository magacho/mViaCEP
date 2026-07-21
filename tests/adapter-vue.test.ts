import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nextTick } from "vue";
import { useViaCep } from "../src/adapters/vue";
import { NotFoundError } from "../src/core/errors";
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

const EXPECTED_ADDRESS: Address = { ...(RAW_OK as Address) };

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

describe("useViaCep (Vue 3 composable)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes reactive refs with sensible initial state", () => {
    const { address, loading, error } = useViaCep();
    expect(address.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("successful lookup sets address.value and toggles loading.value", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(RAW_OK));
    vi.stubGlobal("fetch", fetchMock);

    const { lookup, address, loading, error } = useViaCep();

    const promise = lookup("01001-000");
    // loading flips on synchronously before the network settles.
    expect(loading.value).toBe(true);

    await promise;
    await nextTick();

    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(address.value).toEqual(EXPECTED_ADDRESS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("not-found sets error.value to a NotFoundError and leaves address null", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ erro: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { lookup, address, loading, error } = useViaCep();

    await lookup("99999-999");
    await nextTick();

    expect(loading.value).toBe(false);
    expect(address.value).toBeNull();
    expect(error.value).toBeInstanceOf(NotFoundError);
    expect((error.value as NotFoundError).type).toBe("not_found");
  });

  it("a fresh lookup clears a previous error", async () => {
    const errFetch = vi.fn().mockResolvedValue(jsonResponse({ erro: true }));
    vi.stubGlobal("fetch", errFetch);

    const vc = useViaCep();
    await vc.lookup("99999-998");
    await nextTick();
    expect(vc.error.value).toBeInstanceOf(NotFoundError);

    const okFetch = vi.fn().mockResolvedValue(jsonResponse(RAW_OK));
    vi.stubGlobal("fetch", okFetch);

    await vc.lookup("01001-000");
    await nextTick();
    expect(vc.error.value).toBeNull();
    expect(vc.address.value).toEqual(EXPECTED_ADDRESS);
  });

  it("latest-call-wins: a stale in-flight lookup does not overwrite newer state", async () => {
    // First call resolves slowly, second call resolves fast; the second
    // (latest) result must be the one that lands.
    const slow: ViaCepRawResponse = { ...RAW_OK, cep: "02002-000" };
    const fast: ViaCepRawResponse = { ...RAW_OK, cep: "03003-000" };

    let resolveSlow!: (r: Response) => void;
    const slowPromise = new Promise<Response>((res) => {
      resolveSlow = res;
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => slowPromise)
      .mockImplementationOnce(() => Promise.resolve(jsonResponse(fast)));
    vi.stubGlobal("fetch", fetchMock);

    const { lookup, address, loading } = useViaCep();

    const p1 = lookup("02002-000");
    const p2 = lookup("03003-000");

    await p2;
    await nextTick();

    // Now let the stale first request finish.
    resolveSlow(jsonResponse(slow));
    await p1;
    await nextTick();

    expect(address.value?.cep).toBe("03003-000");
    expect(loading.value).toBe(false);
  });

  it("reset() clears the refs back to initial state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(RAW_OK));
    vi.stubGlobal("fetch", fetchMock);

    const { lookup, address, loading, error, reset } = useViaCep();

    await lookup("01001-000");
    await nextTick();
    expect(address.value).not.toBeNull();

    reset();
    expect(address.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });
});
