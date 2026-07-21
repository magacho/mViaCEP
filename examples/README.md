# Exemplos do mViaCEP

Uma demo mínima e executável por adapter. Cada pasta é autocontida.

| Adapter | Pasta | O que mostra | Como rodar |
|---------|-------|--------------|------------|
| **Vanilla** | [`vanilla/`](./vanilla/) | Autopreenchimento com `bindCep` num `<input>`, sem build. | Abra `vanilla/index.html` no navegador (veja nota do CDN abaixo). |
| **React** | [`react/`](./react/) | Hook `useViaCep()` de `mviacep/react` num formulário. | `cd react && npm install && npm run dev` |
| **Vue 3** | [`vue/`](./vue/) | Composable `useViaCep()` de `mviacep/vue` (refs reativas). | `cd vue && npm install && npm run dev` |
| **Angular** | [`angular/`](./angular/) | `ViaCepService` de `mviacep/angular` (Observable) num Reactive Form. | Cole o snippet num app standalone (veja `angular/README.md`). |

## Notas importantes

- **Estes exemplos ficam fora do gate da lib** (excluídos do ESLint e do
  `tsconfig`), então não passam pelo typecheck/lint do pacote — são demos.
- **Pacote ainda não publicado no npm.** Os exemplos React/Vue/Angular declaram
  a dependência `mviacep` mas você precisa apontá-la para a cópia local
  (`npm link` ou caminho `file:`) e ter rodado `npm run build` na raiz do
  repositório. Cada README explica o passo a passo.
- **Vanilla via CDN:** o `index.html` carrega, por padrão, o build local
  (`../../dist/cdn/mviacep.global.js`, gerado por `npm run build`). Um comentário
  no arquivo mostra como trocar pela URL do jsDelivr assim que o pacote for
  publicado. Obs.: o adapter vanilla (`bindCep`) entra no bundle global na issue
  #12; até lá a demo usa um fallback sobre `mViaCEP.lookup` (documentado no HTML).
