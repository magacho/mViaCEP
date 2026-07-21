// Standalone Angular component demonstrating mViaCEP.
//
// Injeta `ViaCepService` de `mviacep/angular`, consulta o CEP via Observable
// `lookup()` e preenche um Reactive Form. Erros tipados do core
// (`NotFoundError`, `InvalidCepError`, `NetworkError`) são tratados no callback
// `error` da subscription.
//
// Copie este arquivo para `src/app/app.component.ts` de um app Angular standalone
// (veja o README.md deste diretório para o passo a passo).

import { Component, inject, DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { ViaCepService } from "mviacep/angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main style="font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto">
      <h1 style="font-size: 1.4rem">mViaCEP — demo Angular</h1>
      <p>Digite um CEP e saia do campo (blur) para autopreencher.</p>

      <form [formGroup]="form">
        <label style="display: grid; gap: 4px">
          CEP
          <input
            type="text"
            inputmode="numeric"
            placeholder="00000-000"
            maxlength="9"
            formControlName="cep"
            (blur)="onLookup()"
            style="padding: 8px; font-size: 16px"
          />
        </label>

        <div style="min-height: 1.5rem; margin-top: 8px" role="status" aria-live="polite">
          <span *ngIf="loading" style="color: #0366d6">Buscando…</span>
          <span *ngIf="errorMessage" style="color: #c00">{{ errorMessage }}</span>
        </div>

        <label style="display: grid; gap: 4px; margin-top: 8px">
          Logradouro
          <input type="text" formControlName="logradouro" readonly />
        </label>
        <label style="display: grid; gap: 4px">
          Bairro
          <input type="text" formControlName="bairro" readonly />
        </label>
        <label style="display: grid; gap: 4px">
          Localidade
          <input type="text" formControlName="localidade" readonly />
        </label>
        <label style="display: grid; gap: 4px">
          UF
          <input type="text" formControlName="uf" readonly />
        </label>
      </form>
    </main>
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
    logradouro: { value: "", disabled: false },
    bairro: "",
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
            bairro: address.bairro,
            localidade: address.localidade,
            uf: address.uf,
          });
        },
        error: (err: unknown) => {
          this.loading = false;
          this.form.patchValue({ logradouro: "", bairro: "", localidade: "", uf: "" });
          // Os erros do core carregam um discriminante `.type`.
          const type = (err as { type?: string } | null)?.type;
          if (type === "not_found") this.errorMessage = "CEP não encontrado.";
          else if (type === "invalid_cep") this.errorMessage = "CEP inválido.";
          else this.errorMessage = "Erro ao consultar o CEP. Tente novamente.";
        },
      });
  }
}
