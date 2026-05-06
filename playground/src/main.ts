import { createApp } from "vue";
import { createCapraPlugin } from "@capra-ui/core";

// Note: tokens.css NOT imported — it `@import "tailwindcss"` which the playground
// does not require. Framework components use CSS vars from tokens-v2.css + theme.css,
// not Tailwind utility classes (per ADR-019). See DECISIONS.md F5.
import "../../src/styles/tokens-v2.css";
import "../../src/styles/theme.css";
import "../../src/styles/dark.css";
import "../../src/styles/responsive.css";
import "./playground.css";

import App from "./App.vue";

createApp(App)
  .use(
    createCapraPlugin({
      locale: "pt-BR",
      currency: "BRL",
    }),
  )
  .mount("#app");
