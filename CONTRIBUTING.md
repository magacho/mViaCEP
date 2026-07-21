# Contribuindo com o mViaCEP

Obrigado pelo interesse! Este projeto é organizado de forma **orientada a issues** e executado em **ondas** (waves), para permitir trabalho em paralelo sem conflito.

## Visão geral do processo

- O trabalho é rastreado em [Issues](../../issues), agrupadas em **milestones**: `M1 Core`, `M2 Adapters`, `M3 Distribuição & Release`.
- As issues são organizadas em **ondas** que respeitam dependências reais. Tudo dentro de uma onda pode andar em paralelo; a onda seguinte começa quando a anterior estiver integrada na `main`.
- A issue **📋 de processo** (fixada no topo do repositório) mostra o progresso atual e o mapa das ondas.

| Onda | Issues | Depende de |
|------|--------|-----------|
| 0 Bootstrap | #1 | — |
| 1 Núcleo (primitivas) | #2 cep · #3 errors · #4 types | #1 |
| 2 Núcleo (runtime) | #5 client · #6 busca reversa | #2 #3 #4 |
| 3 Adapters (fan-out) | #7 vanilla · #8 react · #9 vue · #10 angular · #11 examples | #5 |
| 4 Distribuição | #12 build · #13 docs · #14 release | #7–#10 |

## Regras de contribuição

1. **Uma issue → um branch → um PR.**
   - Branch: `feat/<área>-<nome>` (ex.: `feat/core-cep`, `feat/adapter-react`).
   - Título do PR termina com o número da issue; o corpo inclui `Closes #N`.
2. **TDD é obrigatório em issues de código.** Escreva o teste primeiro, veja falhar, implemente até passar. Não abra issues de "escrever testes depois".
3. **O núcleo (`src/core/`) é agnóstico de framework.** Nada de imports de React/Vue/Angular/DOM ali. Adapters finos ficam em `src/adapters/*` e apenas traduzem os resultados do core.
4. **Não edite os barrels em PRs paralelos.** Ao trabalhar em paralelo, crie só o seu módulo + testes; a fiação dos exports (`src/index.ts`, `src/core/index.ts`) é feita numa etapa de integração após o merge, para evitar conflitos.
5. **Definition of Done inclui documentação.** Cada adapter entrega seu trecho de "como usar" no próprio PR.

## Comandos

```bash
npm install
npm test          # roda os testes (vitest)
npm run test:watch
npm run lint
npm run typecheck
npm run build     # gera ESM + CJS + bundle CDN (IIFE)
```

Rodar um teste específico:

```bash
npx vitest run tests/cep.test.ts
npx vitest run -t "nome do teste"
```

## Gotcha importante do ViaCEP

A API responde **HTTP 200** com corpo `{ "erro": true }` (às vezes `"true"` como string) para um CEP bem-formado mas inexistente. O núcleo traduz isso em `NotFoundError` — nunca trate como sucesso vazio.

## Merge

Squash + delete branch. A pasta `.claude/` (worktrees de agentes) é ignorada e nunca deve ser commitada.
