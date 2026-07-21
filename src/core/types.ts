// Framework-agnostic type contract exposed to consumers of mViaCEP.
// No React/Vue/Angular/DOM imports allowed here (see CLAUDE.md).

/**
 * Sigla de uma das 27 Unidades Federativas do Brasil (26 estados + Distrito Federal).
 */
export type Uf =
  | "AC" // Acre
  | "AL" // Alagoas
  | "AP" // Amapá
  | "AM" // Amazonas
  | "BA" // Bahia
  | "CE" // Ceará
  | "DF" // Distrito Federal
  | "ES" // Espírito Santo
  | "GO" // Goiás
  | "MA" // Maranhão
  | "MT" // Mato Grosso
  | "MS" // Mato Grosso do Sul
  | "MG" // Minas Gerais
  | "PA" // Pará
  | "PB" // Paraíba
  | "PR" // Paraná
  | "PE" // Pernambuco
  | "PI" // Piauí
  | "RJ" // Rio de Janeiro
  | "RN" // Rio Grande do Norte
  | "RS" // Rio Grande do Sul
  | "RO" // Rondônia
  | "RR" // Roraima
  | "SC" // Santa Catarina
  | "SP" // São Paulo
  | "SE" // Sergipe
  | "TO"; // Tocantins

/**
 * Endereço normalizado retornado pela consulta de um CEP.
 *
 * Cada campo corresponde a uma propriedade do JSON da API ViaCEP. Todos os
 * valores são `string` porque a ViaCEP sempre serializa seus campos como texto
 * (inclusive códigos numéricos como IBGE e SIAFI).
 */
export interface Address {
  /** CEP formatado pela ViaCEP no padrão "00000-000". */
  cep: string;
  /** Logradouro (nome da rua, avenida, praça etc.). */
  logradouro: string;
  /** Complemento do logradouro (ex.: "de 1 a 100", "lado ímpar"). */
  complemento: string;
  /** Unidade associada ao CEP (usada em CEPs de grandes usuários/caixas postais). */
  unidade: string;
  /** Bairro. */
  bairro: string;
  /** Localidade (município / cidade). */
  localidade: string;
  /** Sigla da Unidade Federativa (ex.: "SP", "RJ"). */
  uf: string;
  /** Nome do estado por extenso (ex.: "São Paulo"). */
  estado: string;
  /** Região do país (ex.: "Sudeste", "Nordeste"). */
  regiao: string;
  /** Código do município no IBGE. */
  ibge: string;
  /** Código GIA (Guia de Informação e Apuração do ICMS), usado em São Paulo. */
  gia: string;
  /** Código de DDD da localidade. */
  ddd: string;
  /** Código SIAFI do município. */
  siafi: string;
}

/**
 * Corpo bruto (raw) retornado pela API ViaCEP antes de qualquer normalização.
 *
 * Estende {@link Address} porque uma resposta bem-sucedida traz exatamente os
 * mesmos campos. Para um CEP bem-formado mas inexistente, a ViaCEP responde
 * HTTP 200 com `{ "erro": true }` (a flag pode vir como boolean `true` ou como
 * a string `"true"`), portanto `erro` é opcional e de tipo permissivo. O core é
 * responsável por traduzir essa flag em um erro "não encontrado" explícito.
 */
export interface ViaCepRawResponse extends Partial<Address> {
  /** Presente apenas quando o CEP não foi encontrado; pode ser `true` ou `"true"`. */
  erro?: boolean | string;
}

/**
 * Resultado de uma consulta de CEP no core.
 *
 * Optamos por expor apenas {@link Address} como resultado de sucesso, mantendo a
 * API simples: falhas (formato inválido, não encontrado, rede) são sinalizadas
 * pelos erros tipados de `errors.ts`, não por variantes deste tipo. Manter o
 * sucesso como um alias nomeado (em vez de usar `Address` diretamente) deixa a
 * evolução futura aberta — por exemplo, migrar para um resultado discriminado
 * `{ ok: true; data: Address } | { ok: false; error: ... }` — sem quebrar os
 * consumidores que já dependem do nome `LookupResult`.
 */
export type LookupResult = Address;
