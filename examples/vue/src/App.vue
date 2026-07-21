<script setup lang="ts">
import { useViaCep } from "mviacep/vue";

// `address`, `loading` e `error` são refs (veja o adapter Vue).
const { lookup, address, loading, error, reset } = useViaCep();

// Traduz o erro tipado do core em mensagem amigável.
function errorMessage(err: unknown): string {
  const type = (err as { type?: string } | null)?.type;
  if (type === "not_found") return "CEP não encontrado.";
  if (type === "invalid_cep") return "CEP inválido.";
  return "Erro ao consultar o CEP. Tente novamente.";
}

function onBlur(event: FocusEvent) {
  lookup((event.target as HTMLInputElement).value);
}
</script>

<template>
  <main style="font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 0 1rem">
    <h1 style="font-size: 1.4rem">mViaCEP — demo Vue</h1>
    <p>Digite um CEP e saia do campo (blur) para autopreencher.</p>

    <label style="display: grid; gap: 4px">
      CEP
      <input
        type="text"
        inputmode="numeric"
        placeholder="00000-000"
        maxlength="9"
        style="padding: 8px; font-size: 16px"
        @blur="onBlur"
      />
    </label>

    <div style="min-height: 1.5rem; margin-top: 8px" role="status" aria-live="polite">
      <span v-if="loading" style="color: #0366d6">Buscando…</span>
      <span v-else-if="error" style="color: #c00">{{ errorMessage(error) }}</span>
    </div>

    <dl v-if="address" style="display: grid; grid-template-columns: auto 1fr; gap: 4px 12px">
      <dt>Logradouro</dt>
      <dd>{{ address.logradouro || "—" }}</dd>
      <dt>Bairro</dt>
      <dd>{{ address.bairro || "—" }}</dd>
      <dt>Localidade</dt>
      <dd>{{ address.localidade }}</dd>
      <dt>UF</dt>
      <dd>{{ address.uf }}</dd>
    </dl>

    <button type="button" style="margin-top: 12px" @click="reset">Limpar</button>
  </main>
</template>
