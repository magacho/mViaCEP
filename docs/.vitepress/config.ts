import { defineConfig } from "vitepress";

// Documentação do mViaCEP — site VitePress (PT-BR).
// Título, navegação e barra lateral. Conteúdo escrito para consumidores da
// biblioteca (npm e CDN) e para quem precisa da referência do core.
export default defineConfig({
  lang: "pt-BR",
  // Project Pages é servido sob /<repo>/, então o site precisa desse base.
  base: "/mViaCEP/",
  title: "mViaCEP",
  description:
    "Biblioteca client-side que envolve a API gratuita do ViaCEP para autopreenchimento e validação de endereço — agnóstica de framework, com adaptadores React, Vue, Angular e vanilla.",
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: "Início", link: "/" },
      { text: "Guia", link: "/guide/getting-started" },
      { text: "API", link: "/api/core" },
      {
        text: "Exemplos",
        link: "https://github.com/magacho/mViaCEP/tree/main/examples",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Guia",
          items: [
            { text: "Começando", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Adaptadores",
          items: [
            { text: "Vanilla", link: "/guide/vanilla" },
            { text: "React", link: "/guide/react" },
            { text: "Vue", link: "/guide/vue" },
            { text: "Angular", link: "/guide/angular" },
          ],
        },
        {
          text: "Referência",
          items: [{ text: "API do core", link: "/api/core" }],
        },
      ],
      "/api/": [
        {
          text: "Referência",
          items: [{ text: "API do core", link: "/api/core" }],
        },
        {
          text: "Guia",
          items: [
            { text: "Começando", link: "/guide/getting-started" },
            { text: "Vanilla", link: "/guide/vanilla" },
            { text: "React", link: "/guide/react" },
            { text: "Vue", link: "/guide/vue" },
            { text: "Angular", link: "/guide/angular" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/magacho/mViaCEP" },
    ],

    editLink: {
      pattern:
        "https://github.com/magacho/mViaCEP/edit/main/docs/:path",
      text: "Editar esta página no GitHub",
    },

    docFooter: {
      prev: "Anterior",
      next: "Próxima",
    },

    outline: {
      label: "Nesta página",
    },

    footer: {
      message: "Publicado sob a licença MIT.",
      copyright: "Feito pela comunidade — dados de endereço via ViaCEP.",
    },

    search: {
      provider: "local",
    },
  },
});
