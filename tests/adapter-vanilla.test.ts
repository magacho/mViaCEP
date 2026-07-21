import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bindCep } from "../src/adapters/vanilla";
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

/** Builds a Response-like object good enough for the core client. */
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

/** Sets an input's value and dispatches the `input` event the adapter listens to. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

describe("bindCep (vanilla adapter)", () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
    input = document.createElement("input");
    document.body.appendChild(input);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    input.remove();
  });

  it("fills via onFill with a mapped Address once a complete valid CEP is typed", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_OK));
    const onFill = vi.fn();
    const onStart = vi.fn();
    const onError = vi.fn();

    const dispose = bindCep(input, { onFill, onStart, onError, debounceMs: 400 });
    type(input, "01001-000");

    await vi.advanceTimersByTimeAsync(400);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onFill).toHaveBeenCalledTimes(1);
    expect(onFill).toHaveBeenCalledWith(EXPECTED_ADDRESS);
    expect(onError).not.toHaveBeenCalled();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("does not call lookup while the CEP is still incomplete", async () => {
    const onFill = vi.fn();
    const dispose = bindCep(input, { onFill, debounceMs: 400 });

    type(input, "0100");
    await vi.advanceTimersByTimeAsync(400);

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(onFill).not.toHaveBeenCalled();
    dispose();
  });

  it("debounces: rapid keystrokes collapse into a single lookup", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ...RAW_OK, cep: "20010-000" }));
    const onFill = vi.fn();
    const dispose = bindCep(input, { onFill, debounceMs: 400 });

    // Rapid typing within the debounce window — only the last value matters.
    type(input, "2");
    await vi.advanceTimersByTimeAsync(100);
    type(input, "2001");
    await vi.advanceTimersByTimeAsync(100);
    type(input, "20010000");
    await vi.advanceTimersByTimeAsync(400);

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(onFill).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("calls onError with NotFoundError for a well-formed but nonexistent CEP", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ erro: true }));
    const onFill = vi.fn();
    const onError = vi.fn();
    const dispose = bindCep(input, { onFill, onError, debounceMs: 400 });

    type(input, "99999999");
    await vi.advanceTimersByTimeAsync(400);

    expect(onFill).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    dispose();
  });

  it("dispose() removes the listener and cancels pending lookups", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ...RAW_OK, cep: "30140-071" }));
    const onFill = vi.fn();
    const dispose = bindCep(input, { onFill, debounceMs: 400 });

    // Type a valid CEP but dispose before the debounce fires.
    type(input, "30140071");
    dispose();
    await vi.advanceTimersByTimeAsync(400);

    // Further input after disposal must be ignored entirely.
    type(input, "30140071");
    await vi.advanceTimersByTimeAsync(400);

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(onFill).not.toHaveBeenCalled();
  });

  it("uses a ~400ms default debounce when debounceMs is omitted", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ...RAW_OK, cep: "40010-000" }));
    const onFill = vi.fn();
    const dispose = bindCep(input, { onFill });

    type(input, "40010000");
    await vi.advanceTimersByTimeAsync(399);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(onFill).toHaveBeenCalledTimes(1);
    dispose();
  });
});
