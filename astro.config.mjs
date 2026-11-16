import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE_URL || "https://flexarion.alwaysdata.net";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  integrations: [
    sitemap({
      // La version embarquée (itch.io) n'est pas une page à indexer.
      filter: (page) => !page.includes("/jouer/embed/"),
      i18n: {
        defaultLocale: "fr",
        locales: {
          fr: "fr-FR",
        },
      },
    }),
  ],
  build: {
    inlineStylesheets: "always",
  },
});
