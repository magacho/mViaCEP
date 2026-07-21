# Adaptador Vue

O adaptador Vue 3 expõe o composable **`useViaCep()`**, um invólucro reativo e fino sobre o núcleo: ele chama `lookup` e traduz o resultado para `ref`s do Vue. Validação, cache e mapeamento de erros permanecem no núcleo.

`vue` é uma peer dependency opcional. Como o composable usa `ref` (que funciona fora de um componente), você pode chamá-lo dentro de `setup()`, em uma store ou de forma isolada.

## Importação

```ts
import { useViaCep } from "mviacep/vue";
```

## `useViaCep()`

Retorna um objeto (`UseViaCep`) com:

| Campo     | Tipo                             | Descrição |
|-----------|----------------------------------|-----------|
| `lookup`  | `(cep: string) => Promise<void>` | Consulta um endereço por CEP, dirigindo o estado reativo: alterna `loading` e, ao assentar, guarda o resultado em `address` ou o erro tipado em `error`. Latest-call-wins: se uma consulta mais nova começa antes de uma antiga assentar, o resultado antigo é descartado. |
| `address` | `Ref<Address \| null>`           | O último endereço resolvido com sucesso, ou `null`. |
| `loading` | `Ref<boolean>`                   | `true` enquanto uma consulta está em andamento. |
| `error`   | `Ref<unknown \| null>`           | O erro tipado lançado pela última consulta, ou `null`. |
| `reset`   | `() => void`                     | Limpa `address`, `loading` e `error`. |

## Exemplo

```vue
<script setup lang="ts">
import { useViaCep } from "mviacep/vue";

// `address`, `loading` e `error` são refs.
const { lookup, address, loading, error, reset } = useViaCep();

// Traduz o erro tipado do core em mensagem amigável.
function errorMessage(err: unknown): string {
  const type = (err as { type?: string } | null)?.type;
  if (type === "not_found") return "CEP não encontrado.";
  if (type === "invalid_cep") return "CEP inválido.";
  return "Erro ao consultar o CEP. Tente novamente.";
}

function onBlur(event: FocusEvent) {
  lookup((event.target as HTMLInputElement).value);
}
</script>

<template>
  <main>
    <label>
      CEP
      <input
        type="text"
        inputmode="numeric"
        placeholder="00000-000"
        maxlength="9"
        @blur="onBlur"
      />
    </label>

    <div role="status" aria-live="polite">
      <span v-if="loading">Buscando…</span>
      <span v-else-if="error">{{ errorMessage(error) }}</span>
    </div>

    <dl v-if="address">
      <dt>Logradouro</dt>
      <dd>{{ address.logradouro || "—" }}</dd>
      <dt>Localidade</dt>
      <dd>{{ address.localidade }}</dd>
      <dt>UF</dt>
      <dd>{{ address.uf }}</dd>
    </dl>

    <button type="button" @click="reset">Limpar</button>
  </main>
</template>
```

Como as propriedades são `ref`s, use-as com `.value` em código JavaScript/TypeScript (`address.value`) e diretamente no `<template>` (o Vue desembrulha automaticamente).

> Veja a demo executável em [`examples/vue`](https://github.com/magacho/mViaCEP/tree/main/examples/vue).
