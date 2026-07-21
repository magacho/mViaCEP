# Adaptador Angular

O adaptador Angular expõe o **`ViaCepService`**, um service injetável que envolve o núcleo. Ele traduz as `Promise`s do núcleo (`lookup`/`search`) em `Observable`s do RxJS, encaixando naturalmente nos padrões reativos do Angular (pipe `async`, `switchMap`, etc.), e também oferece variantes `Promise` para quem prefere `async`/`await`.

`@angular/core` e `rxjs` são peer dependencies opcionais. O service é registrado como singleton via `providedIn: "root"` — basta injetá-lo.

## Importação

```ts
import { ViaCepService } from "mviacep/angular";
```

## API do `ViaCepService`

| Método         | Assinatura | Retorno |
|----------------|-----------|---------|
| `lookup`       | `(cep: string, options?: LookupOptions)` | `Observable<Address>` — emite o `Address` e completa, ou erra com um erro tipado do núcleo. |
| `search`       | `(uf: string, cidade: string, logradouro: string, options?: SearchOptions)` | `Observable<Address[]>` — emite o array (possivelmente vazio) e completa, ou erra. |
| `lookupAsync`  | `(cep: string, options?: LookupOptions)` | `Promise<Address>` — variante Promise de `lookup`. |
| `searchAsync`  | `(uf: string, cidade: string, logradouro: string, options?: SearchOptions)` | `Promise<Address[]>` — variante Promise de `search`. |

Os `Observable`s **erram** (não emitem) quando a consulta falha, com um dos erros tipados do núcleo (`InvalidCepError`, `NotFoundError`, `NetworkError`) — trate-os no callback `error` da subscription.

## Exemplo

```ts
import { Component, inject, DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { ViaCepService } from "mviacep/angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <label>
        CEP
        <input
          type="text"
          inputmode="numeric"
          placeholder="00000-000"
          maxlength="9"
          formControlName="cep"
          (blur)="onLookup()"
        />
      </label>

      <div role="status" aria-live="polite">
        <span *ngIf="loading">Buscando…</span>
        <span *ngIf="errorMessage">{{ errorMessage }}</span>
      </div>

      <input type="text" formControlName="logradouro" readonly />
      <input type="text" formControlName="localidade" readonly />
      <input type="text" formControlName="uf" readonly />
    </form>
  `,
})
export class AppComponent {
  private readonly viaCep = inject(ViaCepService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  errorMessage = "";

  form = this.fb.group({
    cep: "",
    logradouro: "",
    localidade: "",
    uf: "",
  });

  onLookup(): void {
    const cep = this.form.controls.cep.value ?? "";
    this.loading = true;
    this.errorMessage = "";

    this.viaCep
      .lookup(cep)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (address) => {
          this.loading = false;
          this.form.patchValue({
            logradouro: address.logradouro,
            localidade: address.localidade,
            uf: address.uf,
          });
        },
        error: (err: unknown) => {
          this.loading = false;
          // Os erros do core carregam um discriminante `.type`.
          const type = (err as { type?: string } | null)?.type;
          if (type === "not_found") this.errorMessage = "CEP não encontrado.";
          else if (type === "invalid_cep") this.errorMessage = "CEP inválido.";
          else this.errorMessage = "Erro ao consultar o CEP. Tente novamente.";
        },
      });
  }
}
```

> Veja a demo executável em [`examples/angular`](https://github.com/magacho/mViaCEP/tree/main/examples/angular).
