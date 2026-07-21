# Adaptador React

O adaptador React expõe o hook **`useViaCep()`**, uma camada fina sobre o núcleo: ele chama `lookup` e traduz o resultado para estado do React. Toda a validação, cache e mapeamento de erros continuam no núcleo.

`react` é uma peer dependency opcional — instale-a no seu projeto normalmente.

## Importação

```ts
import { useViaCep } from "mviacep/react";
```

## `useViaCep()`

Retorna um objeto (`UseViaCepResult`) com:

| Campo     | Tipo                             | Descrição |
|-----------|----------------------------------|-----------|
| `lookup`  | `(cep: string) => Promise<void>` | Consulta um endereço por CEP. Liga `loading`, e ao terminar guarda o `Address` em `address` ou o erro tipado em `error`. Só o resultado da chamada mais recente é aplicado; nada é gravado após o componente desmontar. |
| `address` | `Address \| null`                | O último endereço resolvido com sucesso, ou `null`. |
| `loading` | `boolean`                        | `true` enquanto uma consulta está em andamento. |
| `error`   | `unknown \| null`                | O erro tipado da última consulta que falhou, ou `null`. |
| `reset`   | `() => void`                     | Limpa `address`, `error` e `loading`. |

## Exemplo

```tsx
import { useViaCep } from "mviacep/react";

// Traduz o erro tipado do core em uma mensagem amigável.
function errorMessage(error: unknown): string {
  const type = (error as { type?: string } | null)?.type;
  if (type === "not_found") return "CEP não encontrado.";
  if (type === "invalid_cep") return "CEP inválido.";
  return "Erro ao consultar o CEP. Tente novamente.";
}

export function AddressForm() {
  const { lookup, address, loading, error, reset } = useViaCep();

  return (
    <main>
      <label>
        CEP
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          onBlur={(e) => lookup(e.target.value)}
        />
      </label>

      <div role="status" aria-live="polite">
        {loading && <span>Buscando…</span>}
        {error && <span>{errorMessage(error)}</span>}
      </div>

      {address && (
        <dl>
          <dt>Logradouro</dt>
          <dd>{address.logradouro || "—"}</dd>
          <dt>Localidade</dt>
          <dd>{address.localidade}</dd>
          <dt>UF</dt>
          <dd>{address.uf}</dd>
        </dl>
      )}

      <button type="button" onClick={reset}>
        Limpar
      </button>
    </main>
  );
}
```

Aqui a consulta é disparada no `onBlur` do campo de CEP, mas você pode chamar `lookup` de onde fizer sentido (um `onChange` com seu próprio debounce, um botão, etc.). Como o núcleo faz cache pelo CEP normalizado, consultas repetidas do mesmo CEP não voltam à rede.

> Veja a demo executável em [`examples/react`](https://github.com/magacho/mViaCEP/tree/main/examples/react).
