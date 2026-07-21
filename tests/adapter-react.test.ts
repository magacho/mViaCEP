import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useViaCep } from "../src/adapters/react/index";
import { NotFoundError } from "../src/core/errors";
import type { ViaCepRawResponse } from "../src/core/types";

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

/** Builds a Response-like object good enough for the core client. */
function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

/**
 * A deferred promise helper so a test can control exactly when a `fetch`
 * resolves — used to observe the intermediate `loading` state and to force
 * out-of-order responses.
 */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type FetchMock = ReturnType<typeof vi.fn>;
const fetchMock = () => fetch as unknown as FetchMock;

describe("useViaCep", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useViaCep());
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("a successful lookup sets address and toggles loading", async () => {
    const def = deferred<Response>();
    fetchMock().mockReturnValue(def.promise);

    const { result } = renderHook(() => useViaCep());

    let lookupPromise!: Promise<void>;
    act(() => {
      lookupPromise = result.current.lookup("01001-000");
    });

    // While the fetch is pending, loading must be true.
    expect(result.current.loading).toBe(true);
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      def.resolve(jsonResponse(RAW_OK));
      await lookupPromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.address).toEqual({
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
    });
    expect(result.current.error).toBeNull();
  });

  it("a not-found CEP sets error to a NotFoundError and leaves address null", async () => {
    fetchMock().mockResolvedValue(jsonResponse({ erro: true }));

    const { result } = renderHook(() => useViaCep());

    await act(async () => {
      await result.current.lookup("99999-999");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeInstanceOf(NotFoundError);
  });

  it("reset() clears address, error and loading", async () => {
    fetchMock().mockResolvedValue(jsonResponse({ ...RAW_OK, cep: "01310-100" }));

    const { result } = renderHook(() => useViaCep());

    await act(async () => {
      await result.current.lookup("01310-100");
    });

    expect(result.current.address).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("only the latest lookup wins (out-of-order responses)", async () => {
    // Fresh CEPs so neither is served from the core's shared cache — both must
    // go through the (deferred) fetch mock for timing control.
    const first = deferred<Response>();
    const second = deferred<Response>();
    fetchMock()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useViaCep());

    let firstCall!: Promise<void>;
    let secondCall!: Promise<void>;
    act(() => {
      firstCall = result.current.lookup("30140-071");
    });
    act(() => {
      secondCall = result.current.lookup("40020-000");
    });

    // Resolve the SECOND (latest) call first, then the stale first call.
    await act(async () => {
      second.resolve(
        jsonResponse({
          ...RAW_OK,
          cep: "40020-000",
          localidade: "Salvador",
        }),
      );
      await secondCall;
      first.resolve(
        jsonResponse({
          ...RAW_OK,
          cep: "30140-071",
          localidade: "Belo Horizonte",
        }),
      );
      await firstCall;
    });

    // The stale first response must NOT clobber the latest result.
    expect(result.current.address?.cep).toBe("40020-000");
    expect(result.current.loading).toBe(false);
  });

  it("clears a previous error on a new successful lookup", async () => {
    fetchMock().mockResolvedValueOnce(jsonResponse({ erro: true }));

    const { result } = renderHook(() => useViaCep());

    await act(async () => {
      await result.current.lookup("99999-999");
    });
    expect(result.current.error).toBeInstanceOf(NotFoundError);

    fetchMock().mockResolvedValueOnce(
      jsonResponse({ ...RAW_OK, cep: "70150-900" }),
    );
    await act(async () => {
      await result.current.lookup("70150-900");
    });

    expect(result.current.error).toBeNull();
    expect(result.current.address?.cep).toBe("70150-900");
  });
});
