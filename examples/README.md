# Exemplos do mViaCEP

Uma demo mínima e executável por adapter. Cada pasta é autocontida.

| Demo | Arquivo/Pasta | O que mostra | Como rodar |
|------|---------------|--------------|------------|
| **Playground** ⭐ | [`playground.html`](./playground.html) | Autofill ao vivo (ViaCEP real) **+ suíte de testes do núcleo** rodando no browser. Carrega a lib publicada via CDN. | Abra o arquivo no navegador (precisa de internet). |
| **Vanilla** | [`vanilla/`](./vanilla/) | Autopreenchimento com `bindCep` num `<input>`, sem build. | Abra `vanilla/index.html` no navegador. |
| **React** | [`react/`](./react/) | Hook `useViaCep()` de `mviacep/react` num formulário. | `cd react && npm install && npm run dev` |
| **Vue 3** | [`vue/`](./vue/) | Composable `useViaCep()` de `mviacep/vue` (refs reativas). | `cd vue && npm install && npm run dev` |
| **Angular** | [`angular/`](./angular/) | `ViaCepService` de `mviacep/angular` (Observable) num Reactive Form. | Cole o snippet num app standalone (veja `angular/README.md`). |

## Notas importantes

- **Estes exemplos ficam fora do gate da lib** (excluídos do ESLint e do
  `tsconfig`), então não passam pelo typecheck/lint do pacote — são demos.
- **`playground.html` consulta o ViaCEP de verdade** (rede real, CORS liberado)
  e carrega a biblioteca publicada de `cdn.jsdelivr.net/npm/mviacep`. Não usa
  mocks: as funções puras e os erros tipados vêm da lib real.
- O pacote está publicado no npm (`mviacep`). Os exemplos React/Vue/Angular
  puxam a dependência normalmente; para desenvolver contra uma versão local, use
  `npm link` ou um caminho `file:` (cada README explica).
