import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://gurbaaz.xyz",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  markdown: { syntaxHighlight: "shiki" },
});
