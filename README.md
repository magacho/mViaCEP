# mViaCEP

Biblioteca **client-side** open source que usa a API gratuita do [ViaCEP](https://viacep.com.br) para adicionar **autopreenchimento e validação de endereço** a projetos da comunidade.

- **Agnóstica de framework** — núcleo puro + adaptadores finos para React, Vue, Angular e vanilla.
- **Roda no browser** — leve, sem dependências pesadas; distribuída via npm (ESM/CJS) e via `<script>` por CDN (UMD).
- **Erros tipados** — distingue CEP inválido, CEP não encontrado e falha de rede (o ViaCEP responde HTTP 200 com `{ "erro": true }` para CEP inexistente).

> ✅ **v0.1.0 — primeiro MVP.** Núcleo + adapters (vanilla/React/Vue/Angular) + distribuição CDN. Acompanhe o progresso pelas [Issues](../../issues) e [Milestones](../../milestones).

## Status

Primeiro release funcional (`0.1.0`). Consulte as [Milestones](../../milestones) para o histórico por fase (Core → Adapters → Distribuição) e a [documentação](./docs/guide/getting-started.md) para uso.

## Documentação

📖 **Site ao vivo: <https://magacho.github.io/mViaCEP/>** · 🧪 [Playground (ViaCEP real)](https://magacho.github.io/mViaCEP/examples/playground.html)

- **[Começando](./docs/guide/getting-started.md)** — instalação via npm e CDN.
- Guias por adapter: [Vanilla](./docs/guide/vanilla.md) · [React](./docs/guide/react.md) · [Vue](./docs/guide/vue.md) · [Angular](./docs/guide/angular.md).
- **[Referência de API do core](./docs/api/core.md)** — `lookup`, `search`, validação, erros tipados.

O conteúdo acima também roda como site (VitePress): `npm run docs:dev`.

## Exemplos

Há uma demo mínima e executável por adapter em [`examples/`](./examples/):
vanilla (HTML único via CDN), React e Vue 3 (apps Vite) e Angular (componente
standalone). Veja o [índice dos exemplos](./examples/README.md) para o que cada
um mostra e como rodar.

## Licença

[MIT](./LICENSE)
