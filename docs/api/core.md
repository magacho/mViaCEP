# Referência de API — core

O núcleo (`mviacep`) é agnóstico de framework: só busca, valida, formata e faz cache. Todas as funções e tipos abaixo são exportados da raiz do pacote:

```ts
import {
  lookup,
  search,
  normalize,
  isValid,
  mask,
  createMemoryCache,
  createSessionStorageCache,
  InvalidCepError,
  NotFoundError,
  NetworkError,
  isViaCepError,
} from "mviacep";
import type { Address, Uf, LookupOptions, SearchOptions, CacheLike } from "mviacep";
```

No bundle CDN, os mesmos símbolos ficam disponíveis em `window.mViaCEP`.

## `lookup(cep, options?)`

Consulta um endereço brasileiro por CEP na API do ViaCEP.

```ts
function lookup(cep: string, options?: LookupOptions): Promise<Address>;
```

**Parâmetros**

- `cep: string` — CEP em qualquer formato (ex.: `"01001-000"`, `"01001000"`, `" 01001-000 "`). É normalizado internamente.
- `options?: LookupOptions` — veja abaixo.

**Retorno:** `Promise<Address>` — resolve com o [`Address`](#tipo-address) normalizado.

**Fluxo e erros**

1. Normaliza a entrada. Se não for um CEP bem-formado de 8 dígitos, **lança [`InvalidCepError`](#erros-tipados)** — a rede nunca é acessada.
2. Se houver acerto no cache (chave = CEP normalizado), retorna o `Address` cacheado sem tocar na rede.
3. Caso contrário, faz `fetch` em `https://viacep.com.br/ws/{cep}/json/` com timeout via `AbortController`.
4. Status não-2xx, falha de rede ou timeout **lançam [`NetworkError`](#erros-tipados)** (a causa subjacente é preservada em `.cause`).
5. Um corpo `{ "erro": true }` (ou `{ "erro": "true" }`) **lança [`NotFoundError`](#erros-tipados)**; resultados "não encontrado" **não** são cacheados.
6. Uma resposta bem-sucedida é mapeada para `Address`, cacheada e retornada.

### `LookupOptions`

| Opção       | Tipo          | Padrão | Descrição |
|-------------|---------------|--------|-----------|
| `timeoutMs` | `number`      | `8000` | Aborta a requisição após esse tempo (ms). |
| `cache`     | `CacheLike`   | cache em memória compartilhado no módulo | Cache a consultar/popular. |
| `signal`    | `AbortSignal` | —      | `AbortSignal` externo; abortá-lo aborta a requisição em andamento. Se já estiver abortado, a chamada rejeita com `NetworkError`. |

```ts
import { lookup, createMemoryCache } from "mviacep";

const cache = createMemoryCache();
const controller = new AbortController();

const address = await lookup("01001-000", {
  timeoutMs: 5000,
  cache,
  signal: controller.signal,
});
```

## `search(uf, cidade, logradouro, options?)`

Busca reversa: encontra endereços por UF, cidade e logradouro (endpoint `https://viacep.com.br/ws/{uf}/{cidade}/{logradouro}/json/`).

```ts
function search(
  uf: string,
  cidade: string,
  logradouro: string,
  options?: SearchOptions,
): Promise<Address[]>;
```

**Parâmetros**

- `uf: string` — UF de exatamente 2 letras (ex.: `"SP"`). Case-insensitive.
- `cidade: string` — nome do município (mínimo 3 caracteres).
- `logradouro: string` — nome do logradouro (mínimo 3 caracteres).
- `options?: SearchOptions` — veja abaixo.

**Retorno:** `Promise<Address[]>` — resolve com um **array** de endereços, **possivelmente vazio**.

**Fluxo e erros**

1. Faz _trim_ das entradas e valida: `uf` deve ter 2 letras, e `cidade`/`logradouro` pelo menos 3 caracteres. Em entrada inválida **lança [`InvalidCepError`](#erros-tipados)** (reaproveitado como erro de validação deste módulo) — a rede nunca é acessada.
2. Faz URL-encode de cada segmento (cidades e ruas têm espaços e acentos).
3. Status não-2xx, falha de rede ou timeout **lançam [`NetworkError`](#erros-tipados)**.
4. **Um array vazio resolve com `[]`** (não é `NotFoundError`) — busca reversa pode legitimamente não ter correspondências.
5. Se o ViaCEP responder `{ "erro": true }` (em vez de um array) a uma consulta malformada, isso é tratado como "sem correspondências" e também resolve com `[]` — o contrato de sucesso é sempre um array.

### `SearchOptions`

| Opção       | Tipo          | Padrão | Descrição |
|-------------|---------------|--------|-----------|
| `timeoutMs` | `number`      | `8000` | Aborta a requisição após esse tempo (ms). |
| `signal`    | `AbortSignal` | —      | `AbortSignal` externo; abortá-lo aborta a requisição em andamento. |

> Diferente de `lookup`, `search` **não** aceita a opção `cache`.

```ts
import { search } from "mviacep";

const results = await search("SP", "São Paulo", "Avenida Paulista");
console.log(results.length); // número de correspondências (pode ser 0)
```

## Utilitários de CEP

Funções puras e síncronas para tratar strings de CEP. Nenhuma acessa a rede.

### `normalize(cep)`

```ts
function normalize(cep: string): string;
```

Remove todo caractere não numérico e retorna os dígitos restantes. **Não** valida o comprimento — apenas limpa a entrada.

```ts
normalize("01001-000"); // "01001000"
normalize(" 01001 000 "); // "01001000"
```

### `isValid(cep)`

```ts
function isValid(cep: string): boolean;
```

Retorna `true` se, após normalizar, o CEP tiver exatamente 8 dígitos.

```ts
isValid("01001-000"); // true
isValid("0100");      // false
```

### `mask(cep)`

```ts
function mask(cep: string): string;
```

Formata um CEP como `00000-000`. Com 8+ dígitos após normalizar, usa os 8 primeiros e insere o hífen. Com menos, retorna o melhor mascaramento parcial (o hífen só aparece a partir de 6 dígitos). **Nunca lança.**

```ts
mask("01001000");   // "01001-000"
mask("010010009");  // "01001-000" (excedente ignorado)
mask("01001");      // "01001"
mask("010010");     // "01001-0"
```

## Erros tipados

Toda falha do núcleo resolve para uma destas variantes. Cada erro é discriminável **por `instanceof`** e **por um literal `type`**, então consumidores podem usar `switch (error.type)` ou `instanceof`.

| Classe            | `.type`        | Propriedades extras | Quando é lançado |
|-------------------|----------------|---------------------|------------------|
| `InvalidCepError` | `"invalid_cep"`| `cep: string` (valor original) | CEP malformado (não são 8 dígitos após normalização); também usado por `search` para validação de entrada. |
| `NotFoundError`   | `"not_found"`  | `cep: string` (CEP bem-formado consultado) | ViaCEP responde HTTP 200 com `{ "erro": true }` para um CEP inexistente (só em `lookup`). |
| `NetworkError`    | `"network"`    | `cause?: unknown` (erro subjacente, quando disponível) | Falha de rede, timeout, status HTTP não-2xx, ou falha ao parsear a resposta. |

Todas estendem `Error`. O tipo `ViaCepError` é a união das três.

### `isViaCepError(e)`

```ts
function isViaCepError(e: unknown): e is ViaCepError;
```

Type guard que estreita um valor desconhecido para uma das variantes de erro do ViaCEP.

```ts
import { lookup, isViaCepError, NotFoundError, NetworkError } from "mviacep";

try {
  const address = await lookup(input);
} catch (error) {
  if (error instanceof NotFoundError) {
    // CEP bem-formado, mas sem endereço
  } else if (error instanceof NetworkError) {
    // rede/timeout/HTTP — inspecione error.cause
  } else if (isViaCepError(error)) {
    // InvalidCepError (formato inválido)
  } else {
    throw error; // não era um erro do mViaCEP
  }
}
```

Alternativamente, via discriminante `.type` (útil quando você não tem acesso às classes, p.ex. no CDN):

```ts
switch ((error as { type?: string })?.type) {
  case "not_found":
    // ...
    break;
  case "invalid_cep":
    // ...
    break;
  case "network":
    // ...
    break;
}
```

## Cache

`lookup` faz cache dos resultados com chave no **CEP normalizado**, então `01001000`, `01001-000` e `"01001-000 "` compartilham a mesma entrada. Por padrão usa um cache em memória compartilhado no módulo. Você pode fornecer o seu via `LookupOptions.cache`.

### `CacheLike`

Contrato mínimo (get/set síncronos) — qualquer store que o satisfaça serve (um `Map`, `sessionStorage`, ou uma implementação própria). As chaves são sempre o CEP normalizado (8 dígitos).

```ts
interface CacheLike {
  get(key: string): Address | undefined;
  set(key: string, value: Address): void;
}
```

### `createMemoryCache()`

```ts
function createMemoryCache(): CacheLike;
```

Cria um cache em memória isolado, apoiado em um `Map`. Cada chamada retorna uma instância nova — útil em testes ou para escopar o cache a um cliente/sessão.

### `createSessionStorageCache(namespace?)`

```ts
function createSessionStorageCache(namespace?: string): CacheLike;
```

Cria um cache apoiado em `sessionStorage`, protegido para ambientes onde ele não existe (Node, SSR, modos de privacidade que lançam ao acessar). Quando `sessionStorage` não pode ser usado, degrada silenciosamente para um no-op (o `get` sempre erra, o `set` não faz nada) — nunca lança. As entradas são namespaced. O `namespace` padrão é `"mviacep"`.

```ts
import { lookup, createSessionStorageCache } from "mviacep";

const cache = createSessionStorageCache();
const address = await lookup("01001-000", { cache });
```

## Tipo `Address`

Endereço normalizado retornado por `lookup` e `search`. Cada campo corresponde a uma propriedade do JSON do ViaCEP. **Todos os valores são `string`** — o ViaCEP serializa todos os campos como texto, inclusive códigos numéricos (IBGE, SIAFI).

```ts
interface Address {
  cep: string;         // CEP formatado pela ViaCEP no padrão "00000-000"
  logradouro: string;  // nome da rua, avenida, praça etc.
  complemento: string; // complemento do logradouro (ex.: "de 1 a 100")
  unidade: string;     // unidade (CEPs de grandes usuários/caixas postais)
  bairro: string;      // bairro
  localidade: string;  // município / cidade
  uf: string;          // sigla da UF (ex.: "SP")
  estado: string;      // nome do estado por extenso (ex.: "São Paulo")
  regiao: string;      // região do país (ex.: "Sudeste")
  ibge: string;        // código do município no IBGE
  gia: string;         // código GIA (ICMS), usado em São Paulo
  ddd: string;         // código de DDD da localidade
  siafi: string;       // código SIAFI do município
}
```

Campos ausentes na resposta do ViaCEP são normalizados para string vazia (`""`), nunca `null`/`undefined`.

## Tipo `Uf`

União literal das siglas das 27 Unidades Federativas do Brasil (26 estados + Distrito Federal): `"AC"`, `"AL"`, `"AP"`, `"AM"`, `"BA"`, `"CE"`, `"DF"`, `"ES"`, `"GO"`, `"MA"`, `"MT"`, `"MS"`, `"MG"`, `"PA"`, `"PB"`, `"PR"`, `"PE"`, `"PI"`, `"RJ"`, `"RN"`, `"RS"`, `"RO"`, `"RR"`, `"SC"`, `"SP"`, `"SE"`, `"TO"`.

> Observação: o campo `uf` de `Address` é tipado como `string` (valor cru do ViaCEP), não como `Uf`. O tipo `Uf` está disponível para tipar suas próprias entradas.
