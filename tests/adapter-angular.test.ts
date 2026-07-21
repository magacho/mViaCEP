// Angular adapter tests. Deliberately lightweight: the service is designed to
// be trivially instantiable with `new ViaCepService()` (no constructor DI), so
// we exercise it WITHOUT Angular's TestBed or zone.js bootstrapping. We just
// `new` it up, mock the network via the global `fetch`, subscribe to the
// returned Observable (via rxjs `firstValueFrom`), and assert.
//
// `reflect-metadata` is imported here (test file only, per the adapter design
// note) so the `@Injectable` decorator's runtime metadata machinery has a
// polyfilled `Reflect` in the Node/jsdom test environment.
import "reflect-metadata";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { firstValueFrom, Observable } from "rxjs";
import { ViaCepService } from "../src/adapters/angular/index";
import { createMemoryCache } from "../src/core/client";
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

describe("ViaCepService (Angular adapter)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is instantiable directly with `new` (no TestBed / DI needed)", () => {
    const service = new ViaCepService();
    expect(service).toBeInstanceOf(ViaCepService);
    expect(typeof service.lookup).toBe("function");
    expect(typeof service.search).toBe("function");
  });

  it("lookup() returns an Observable that emits a mapped Address", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_OK));
    const service = new ViaCepService();

    const result$ = service.lookup("01001-000", { cache: createMemoryCache() });
    expect(result$).toBeInstanceOf(Observable);

    const address = await firstValueFrom(result$);
    expect(address).toEqual(EXPECTED_ADDRESS);
  });

  it("lookup() Observable errors with NotFoundError for the ViaCEP not-found body", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ erro: true }));
    const service = new ViaCepService();

    await expect(
      firstValueFrom(
        service.lookup("99999-999", { cache: createMemoryCache() }),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("search() returns an Observable that emits an Address[]", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([RAW_OK]));
    const service = new ViaCepService();

    const result$ = service.search("SP", "São Paulo", "Praça da Sé");
    expect(result$).toBeInstanceOf(Observable);

    const addresses = await firstValueFrom(result$);
    expect(Array.isArray(addresses)).toBe(true);
    expect(addresses).toEqual([EXPECTED_ADDRESS]);
  });

  it("search() emits [] when ViaCEP returns no matches", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));
    const service = new ViaCepService();

    const addresses = await firstValueFrom(
      service.search("SP", "São Paulo", "Rua Inexistente"),
    );
    expect(addresses).toEqual([]);
  });

  it("lookupAsync() resolves the mapped Address as a Promise", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(RAW_OK));
    const service = new ViaCepService();

    const address = await service.lookupAsync("01001-000", {
      cache: createMemoryCache(),
    });
    expect(address).toEqual(EXPECTED_ADDRESS);
  });
});
