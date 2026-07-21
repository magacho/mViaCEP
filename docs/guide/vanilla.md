# Adaptador Vanilla

O adaptador vanilla liga o núcleo do mViaCEP a um `<input>` comum, escrevendo o autopreenchimento diretamente no DOM. Sua única função pública é **`bindCep`**.

É a base do bundle CDN: por ser _dependency-free_ (só importa o núcleo e usa APIs padrão do DOM), ele acompanha o núcleo no global `window.mViaCEP` — veja [Começando → CDN](/guide/getting-started#uso-via-cdn-script-sem-build).

## Importação

Via npm:

```ts
import { bindCep } from "mviacep/vanilla";
```

Via CDN, use `mViaCEP.bindCep(...)` (o global já expõe a função).

## `bindCep(input, options)`

Liga o comportamento de autopreenchimento a um `<input>`:

1. Escuta o evento `input` e aplica _debounce_ nas rajadas de teclas.
2. Quando o debounce assenta, o valor é normalizado; o `lookup` do núcleo só é chamado quando o CEP parece completo (8 dígitos / passa em `isValid`).
3. No sucesso dispara `onFill(address)`; na falha dispara `onError(error)` com um dos erros tipados do núcleo.
4. Resultados obsoletos são ignorados (se o input muda de novo, ou o binding é descartado, antes de uma consulta resolver, o resultado antigo é descartado — a última consulta sempre vence).

Retorna uma função **`dispose()`** que remove o listener e cancela o timer de debounce e qualquer consulta em andamento.

### Opções (`BindCepOptions`)

| Opção        | Tipo                          | Descrição |
|--------------|-------------------------------|-----------|
| `onFill`     | `(address: Address) => void`  | **Obrigatória.** Chamada com o `Address` resolvido quando um CEP completo e válido é consultado com sucesso. É aqui que você escreve valores no DOM. |
| `onError`    | `(error: unknown) => void`    | Opcional. Chamada com o erro tipado do núcleo (`InvalidCepError`, `NotFoundError` ou `NetworkError`) quando a consulta falha. |
| `onStart`    | `() => void`                  | Opcional. Chamada uma vez, logo antes de uma consulta de rede começar. Útil para um indicador de "carregando". |
| `debounceMs` | `number`                      | Janela de debounce entre teclas, em ms. Padrão: `400`. |

## Exemplo completo

```html
<form autocomplete="off">
  <input id="cep" type="text" inputmode="numeric" placeholder="00000-000" maxlength="9" />
  <div id="status" role="status" aria-live="polite"></div>
  <input id="logradouro" readonly />
  <input id="bairro" readonly />
  <input id="localidade" readonly />
  <input id="uf" readonly />
</form>

<script src="https://cdn.jsdelivr.net/npm/mviacep/dist/cdn/mviacep.global.js"></script>
<script>
  const cepInput = document.getElementById("cep");
  const statusEl = document.getElementById("status");
  const fields = {
    logradouro: document.getElementById("logradouro"),
    bairro: document.getElementById("bairro"),
    localidade: document.getElementById("localidade"),
    uf: document.getElementById("uf"),
  };

  const dispose = mViaCEP.bindCep(cepInput, {
    onStart() {
      statusEl.textContent = "Buscando…";
    },
    onFill(address) {
      fields.logradouro.value = address.logradouro || "";
      fields.bairro.value = address.bairro || "";
      fields.localidade.value = address.localidade || "";
      fields.uf.value = address.uf || "";
      statusEl.textContent = "Endereço encontrado.";
    },
    onError(error) {
      for (const k in fields) fields[k].value = "";
      if (error && error.type === "not_found") statusEl.textContent = "CEP não encontrado.";
      else if (error && error.type === "invalid_cep") statusEl.textContent = "CEP inválido.";
      else statusEl.textContent = "Erro ao consultar o CEP. Tente novamente.";
    },
    debounceMs: 400,
  });

  // Chame dispose() ao remover o formulário para limpar listeners e timers.
  // dispose();
</script>
```

Em um projeto com build (npm), a única diferença é a importação — troque o `<script>` do CDN por:

```ts
import { bindCep } from "mviacep/vanilla";
const dispose = bindCep(cepInput, { /* ...as mesmas opções... */ });
```

> Veja a demo executável em [`examples/vanilla`](https://github.com/magacho/mViaCEP/tree/main/examples/vanilla).
