---
layout: home

hero:
  name: mViaCEP
  text: Autopreenchimento e validação de CEP
  tagline: Biblioteca client-side sobre a API gratuita do ViaCEP — núcleo agnóstico de framework com adaptadores finos para React, Vue, Angular e vanilla.
  actions:
    - theme: brand
      text: Começar
      link: /guide/getting-started
    - theme: alt
      text: Referência de API
      link: /api/core
    - theme: alt
      text: GitHub
      link: https://github.com/magacho/mViaCEP

features:
  - title: Agnóstica de framework
    details: Um núcleo puro que só busca, valida, formata e faz cache. React, Vue, Angular e vanilla são apenas camadas finas por cima — a mesma lógica, sem duplicação.
  - title: Erros tipados
    details: "Distingue CEP inválido, CEP não encontrado e falha de rede. O ViaCEP responde HTTP 200 com { erro: true } para um CEP inexistente — o núcleo traduz isso em NotFoundError, nunca em sucesso vazio."
  - title: Roda no browser
    details: Leve e sem dependências pesadas. Instale via npm (ESM/CJS) ou use direto via CDN com uma única tag <script> que expõe window.mViaCEP.
  - title: Cache e timeout embutidos
    details: Cache em memória (ou sessionStorage) com chave no CEP normalizado, timeout por requisição via AbortController e suporte a AbortSignal externo.
---

## Instalação rápida

::: code-group

```bash [npm]
npm install mviacep
```

```html [CDN]
<script src="https://cdn.jsdelivr.net/npm/mviacep/dist/cdn/mviacep.global.js"></script>
```

:::

```ts
import { lookup } from "mviacep";

const address = await lookup("01001-000");
console.log(address.localidade, address.uf); // "São Paulo" "SP"
```

## Links rápidos

- [Começando](./guide/getting-started.md) — instalação via npm e CDN, a ideia agnóstica de framework e o gotcha do `{ "erro": true }`.
- Guias por adaptador: [Vanilla](./guide/vanilla.md) · [React](./guide/react.md) · [Vue](./guide/vue.md) · [Angular](./guide/angular.md).
- [Referência de API do core](./api/core.md) — `lookup`, `search`, `normalize`/`isValid`/`mask`, erros tipados e o tipo `Address`.
- [Exemplos executáveis](https://github.com/magacho/mViaCEP/tree/main/examples) — uma demo por adaptador.
