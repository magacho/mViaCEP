# mViaCEP — exemplo Angular

Diferente dos demais, este exemplo **não** traz um projeto Angular CLI completo
(seriam centenas de arquivos gerados). Em vez disso, fornecemos um componente
standalone pronto para colar — [`app.component.ts`](./app.component.ts) — que
injeta o `ViaCepService` de `mviacep/angular`, consulta o CEP pelo Observable
`lookup()` e preenche um Reactive Form, tratando os erros tipados do core.

## Como usar

1. Crie um app Angular standalone (Angular 15+):

   ```bash
   npm create @angular@latest mviacep-angular-demo -- --standalone --routing=false --style=css
   cd mviacep-angular-demo
   ```

2. Instale/aponte o pacote `mviacep`. Como ele **ainda não está publicado no
   npm**, use a sua cópia local:

   - **npm link** — na raiz do repositório mViaCEP: `npm run build && npm link`.
     Depois, no projeto Angular: `npm link mviacep`.
   - **caminho `file:`** — adicione `"mviacep": "file:/caminho/para/mViaCEP"` às
     dependências e rode `npm install`. Requer `npm run build` na raiz antes,
     pois o subpath `mviacep/angular` resolve para `dist/`.

   O `ViaCepService` depende de `@angular/core` e `rxjs`, que já fazem parte de
   qualquer app Angular (são peerDependencies da lib).

3. Substitua o `src/app/app.component.ts` gerado pelo conteúdo de
   [`app.component.ts`](./app.component.ts) deste diretório.

4. Rode o app:

   ```bash
   npm start
   ```

## O que o exemplo mostra

- `inject(ViaCepService)` num componente standalone.
- `viaCep.lookup(cep)` retornando `Observable<Address>`, consumido com
  `subscribe({ next, error })` e `takeUntilDestroyed` para limpar a inscrição.
- Preenchimento de um Reactive Form via `patchValue`.
- Tratamento dos erros tipados (`not_found`, `invalid_cep`, rede) pelo
  discriminante `.type`.

> O `ViaCepService` também expõe `search()` (busca reversa, Observable) e as
> variantes `lookupAsync()` / `searchAsync()` baseadas em Promise, caso prefira
> `async`/`await`.
