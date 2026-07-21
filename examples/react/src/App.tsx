import { useViaCep } from "mviacep/react";

// Traduz o erro tipado do core em uma mensagem amigável.
function errorMessage(error: unknown): string {
  const type = (error as { type?: string } | null)?.type;
  if (type === "not_found") return "CEP não encontrado.";
  if (type === "invalid_cep") return "CEP inválido.";
  return "Erro ao consultar o CEP. Tente novamente.";
}

export function App() {
  const { lookup, address, loading, error, reset } = useViaCep();

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.4rem" }}>mViaCEP — demo React</h1>
      <p>Digite um CEP e saia do campo (blur) para autopreencher.</p>

      <label style={{ display: "grid", gap: 4 }}>
        CEP
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          onBlur={(e) => lookup(e.target.value)}
          style={{ padding: 8, fontSize: 16 }}
        />
      </label>

      <div style={{ minHeight: "1.5rem", marginTop: 8 }} role="status" aria-live="polite">
        {loading && <span style={{ color: "#0366d6" }}>Buscando…</span>}
        {error && <span style={{ color: "#c00" }}>{errorMessage(error)}</span>}
      </div>

      {address && (
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }}>
          <dt>Logradouro</dt>
          <dd>{address.logradouro || "—"}</dd>
          <dt>Bairro</dt>
          <dd>{address.bairro || "—"}</dd>
          <dt>Localidade</dt>
          <dd>{address.localidade}</dd>
          <dt>UF</dt>
          <dd>{address.uf}</dd>
        </dl>
      )}

      <button type="button" onClick={reset} style={{ marginTop: 12 }}>
        Limpar
      </button>
    </main>
  );
}
