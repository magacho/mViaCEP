# mViaCEP — exemplo Vue 3

App Vite + Vue 3 mínimo que usa a composable `useViaCep()` de `mviacep/vue`
para montar um formulário de CEP com autopreenchimento. `address`, `loading` e
`error` são refs reativas.

## Rodar

```bash
npm install
npm run dev
```

Abra a URL que o Vite imprimir (por padrão http://localhost:5173).

## Link local do pacote (enquanto `mviacep` não está no npm)

O `package.json` declara `"mviacep": "*"`. Como o pacote ainda **não foi
publicado no npm**, aponte para a sua cópia local antes de `npm install`. Duas
opções:

- **npm link** — na raiz do repositório: `npm run build && npm link`. Depois,
  neste diretório: `npm link mviacep`.
- **caminho `file:`** — troque a dependência no `package.json` para
  `"mviacep": "file:../.."` e rode `npm install`. Requer ter rodado
  `npm run build` na raiz antes (o campo `exports` aponta para `dist/`).

Em ambos os casos é necessário ter buildado a lib (`npm run build` na raiz),
pois os subpaths (`mviacep/vue`) resolvem para `dist/`.
