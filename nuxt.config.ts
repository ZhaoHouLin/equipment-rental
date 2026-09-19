// https://nuxt.com/docs/4.x/api/nuxt-config
import { fileURLToPath } from "node:url"

const styleEntry = fileURLToPath(
  new URL("./app/assets/style.styl", import.meta.url)
).replace(/\\/g, "/")

export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  app: {
    head: {
      viewport: "width=device-width, initial-scale=1",
      title: "設備借用系統",
      meta: [{ name: "description", content: "設備借用系統" }],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
    pageTransition: { name: "page", mode: "out-in" },
  },
  vite: {
    css: {
      preprocessorOptions: {
        stylus: {
          additionalData: `@import "${styleEntry}"`,
        },
      },
    },
  },
  imports: {
    dirs: ["stores"],
  },
  modules: ["@pinia/nuxt"],
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
      },
    },
  },
  // 環境變數見 .env.example
  runtimeConfig: {
    jwtSecret: "",
    sessionMinutes: 30,
    dbPath: "data/rental.sqlite",
    authMode: "local",
    adminUser: "admin",
    adminPasswordHash: "",
    ldapUrl: "",
    ldapDomain: "",
    smtpHost: "",
    smtpPort: 25,
    mailFrom: "",
    seedDemo: "",
    public: {},
  },
})
