// Compile-time "tests" for the core type contract (issue #4).
// This file is type-checked by `npm run typecheck` (tsc --noEmit). It is not a
// runtime test — Vitest ignores `.test-d.ts` files.

import type { Address, LookupResult, Uf, ViaCepRawResponse } from "../src/core/types";

// A fully-populated Address must typecheck.
const _address: Address = {
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
void _address;

// LookupResult is (currently) an alias for Address, so an Address satisfies it.
const _result: LookupResult = _address;
void _result;

// A valid UF abbreviation.
const _uf: Uf = "RJ";
void _uf;

// Raw response: success shape (all address fields present, no `erro`).
const _rawOk: ViaCepRawResponse = { ..._address };
void _rawOk;

// Raw response: not-found shape as boolean.
const _rawErrBool: ViaCepRawResponse = { erro: true };
void _rawErrBool;

// Raw response: not-found shape as string "true".
const _rawErrStr: ViaCepRawResponse = { erro: "true" };
void _rawErrStr;

// --- Deliberate negative checks: wrong shapes MUST fail to typecheck. ---

// @ts-expect-error — missing required Address fields.
const _bad1: Address = { cep: "01001-000" };
void _bad1;

// @ts-expect-error — numeric value not allowed; ViaCEP fields are strings.
const _bad2: Address = { ..._address, ibge: 3550308 };
void _bad2;

// @ts-expect-error — "XX" is not a valid UF abbreviation.
const _bad3: Uf = "XX";
void _bad3;

// @ts-expect-error — `erro` must be boolean | string, not a number.
const _bad4: ViaCepRawResponse = { erro: 1 };
void _bad4;
