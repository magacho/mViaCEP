# mViaCEP

Biblioteca **client-side** open source que usa a API gratuita do [ViaCEP](https://viacep.com.br) para adicionar **autopreenchimento e validação de endereço** a projetos da comunidade.

- **Agnóstica de framework** — núcleo puro + adaptadores finos para React, Vue, Angular e vanilla.
- **Roda no browser** — leve, sem dependências pesadas; distribuída via npm (ESM/CJS) e via `<script>` por CDN (UMD).
- **Erros tipados** — distingue CEP inválido, CEP não encontrado e falha de rede (o ViaCEP responde HTTP 200 com `{ "erro": true }` para CEP inexistente).

> 🚧 Em construção. O trabalho é acompanhado pelas [Issues](../../issues) e milestones do projeto.

## Status

Consulte as [Issues](../../issues) para o backlog e as [Milestones](../../milestones) para o progresso por fase (Core → Adapters → Distribuição).

## Documentação

Guia de uso, guias por adapter e a referência completa da API do core estão no site de documentação (VitePress), em [`docs/`](./docs/) — rode localmente com `npm run docs:dev`.

## Exemplos

Há uma demo mínima e executável por adapter em [`examples/`](./examples/):
vanilla (HTML único via CDN), React e Vue 3 (apps Vite) e Angular (componente
standalone). Veja o [índice dos exemplos](./examples/README.md) para o que cada
um mostra e como rodar.

## Licença

[MIT](./LICENSE)
