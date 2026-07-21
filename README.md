# mViaCEP

Biblioteca **client-side** open source que usa a API gratuita do [ViaCEP](https://viacep.com.br) para adicionar **autopreenchimento e validação de endereço** a projetos da comunidade.

- **Agnóstica de framework** — núcleo puro + adaptadores finos para React, Vue, Angular e vanilla.
- **Roda no browser** — leve, sem dependências pesadas; distribuída via npm (ESM/CJS) e via `<script>` por CDN (UMD).
- **Erros tipados** — distingue CEP inválido, CEP não encontrado e falha de rede (o ViaCEP responde HTTP 200 com `{ "erro": true }` para CEP inexistente).

> 🚧 Em construção. O trabalho é acompanhado pelas [Issues](../../issues) e milestones do projeto.

## Status

Consulte as [Issues](../../issues) para o backlog e as [Milestones](../../milestones) para o progresso por fase (Core → Adapters → Distribuição).

## Licença

[MIT](./LICENSE)
