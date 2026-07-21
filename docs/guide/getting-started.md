# Começando

**mViaCEP** é uma biblioteca client-side que envolve a [API gratuita do ViaCEP](https://viacep.com.br) para adicionar **autopreenchimento e validação de endereço** a projetos da comunidade.

## A ideia: núcleo agnóstico + adaptadores finos

O coração da biblioteca é um **núcleo agnóstico de framework** (`src/core/`). Ele não conhece React, Vue, Angular nem o DOM — apenas **busca, valida, formata e faz cache**. Toda a lógica de comportamento (validação de CEP, cache com chave no CEP normalizado, tradução de erros, timeout) vive num único lugar.

Os adaptadores (`react`, `vue`, `angular`, `vanilla`) são camadas finas por cima. Eles **não reimplementam** validação, cache ou mapeamento de erros — só chamam o núcleo e traduzem o resultado para o idioma de cada framework (hook, composable, service injetável, binding de DOM).

Na prática: você pode usar diretamente o núcleo (`lookup`, `search`) em qualquer ambiente JavaScript, ou escolher o adaptador que combina com o seu framework.

## Instalação via npm

```bash
npm install mviacep
```

O pacote é distribuído em ESM e CJS, com _subpaths_ por adaptador. Importe o núcleo diretamente ou o adaptador desejado:

```ts
import { lookup, search } from "mviacep";        // núcleo
import { useViaCep } from "mviacep/react";        // React
import { useViaCep } from "mviacep/vue";          // Vue 3
import { ViaCepService } from "mviacep/angular";  // Angular
import { bindCep } from "mviacep/vanilla";        // Vanilla / DOM
```

> Os frameworks (`react`, `vue`, `@angular/core`, `rxjs`) são **peer dependencies opcionais**. Instale apenas o que o seu projeto usa; o adaptador escolhido consome o framework que você já tem.

Uso mínimo do núcleo:

```ts
import { lookup } from "mviacep";

const address = await lookup("01001-000");
console.log(address.localidade); // "São Paulo"
console.log(address.uf);         // "SP"
```

## Uso via CDN (`<script>`, sem build)

Para páginas sem etapa de build, carregue o **bundle global (IIFE)** por CDN. Ele empacota o **núcleo + o adaptador vanilla**, então você ganha `lookup`/`search` **e** o autopreenchimento no DOM (`bindCep`) com uma única tag `<script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/mviacep/dist/cdn/mviacep.global.js"></script>
```

Isso expõe o global **`window.mViaCEP`**, que oferece `lookup`, `search`, `bindCep`, os utilitários (`normalize`, `isValid`, `mask`) e os erros tipados.

> Os adaptadores React/Vue/Angular **não** entram no bundle global — eles são exclusivos do npm.

Exemplo de autopreenchimento com `bindCep`, ligando um `<input>` de CEP a campos do formulário:

```html
<input id="cep" type="text" inputmode="numeric" placeholder="00000-000" maxlength="9" />
<input id="logradouro" readonly />
<input id="localidade" readonly />
<input id="uf" readonly />

<script src="https://cdn.jsdelivr.net/npm/mviacep/dist/cdn/mviacep.global.js"></script>
<script>
  const cep = document.getElementById("cep");

  mViaCEP.bindCep(cep, {
    onStart() {
      console.log("Buscando…");
    },
    onFill(address) {
      document.getElementById("logradouro").value = address.logradouro;
      document.getElementById("localidade").value = address.localidade;
      document.getElementById("uf").value = address.uf;
    },
    onError(error) {
      // Os erros do core carregam um discriminante `.type`.
      if (error && error.type === "not_found") console.log("CEP não encontrado.");
      else if (error && error.type === "invalid_cep") console.log("CEP inválido.");
      else console.log("Erro de rede. Tente novamente.");
    },
    debounceMs: 400,
  });
</script>
```

`bindCep` cuida do _debounce_ entre teclas, só chama a rede quando o CEP está completo (8 dígitos) e ignora respostas obsoletas (a última consulta sempre vence). Ele retorna uma função de _dispose_ que remove o listener e cancela timers/consultas pendentes.

## Gotcha importante: `{ "erro": true }` → `NotFoundError`

O ViaCEP responde **HTTP 200** — não um erro HTTP — com o corpo `{ "erro": true }` para um CEP **bem-formado mas inexistente** (a flag pode vir como boolean `true` ou como a string `"true"`).

Se você chamasse a API diretamente, esse caso pareceria um sucesso. O núcleo do mViaCEP **traduz esse corpo em um `NotFoundError`** e o lança, em vez de resolver com um endereço vazio. Trate-o explicitamente:

```ts
import { lookup, isViaCepError, NotFoundError } from "mviacep";

try {
  const address = await lookup("99999-999"); // CEP bem-formado, mas inexistente
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("CEP não encontrado.");
  } else if (isViaCepError(error)) {
    console.log("CEP inválido ou falha de rede.");
  }
}
```

Cada erro também expõe um discriminante literal `.type` (`"not_found"`, `"invalid_cep"`, `"network"`), útil quando você não tem acesso às classes (por exemplo, no `onError` do `bindCep` via CDN). Veja todos os detalhes na [Referência de API](/api/core#erros-tipados).

## Próximos passos

- [Vanilla](/guide/vanilla) — ligar um `<input>` ao DOM com `bindCep`.
- [React](/guide/react) — o hook `useViaCep()`.
- [Vue](/guide/vue) — o composable `useViaCep()`.
- [Angular](/guide/angular) — o `ViaCepService` injetável.
- [Referência de API do core](/api/core) — assinaturas, tipos e erros.
