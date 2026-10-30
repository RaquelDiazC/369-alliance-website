import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import { createApp } from "./server/app";

// Mounts the API inside `pnpm dev`. It is the same createApp() that
// server/index.ts and api/index.ts mount in production, deliberately: this
// plugin used to assemble its own express app from a hand-written list of
// routers, and anything added to server/app.ts and not to that list simply did
// not exist in development. Billing, checkout and the Stripe webhook were all
// in that gap.
function fieldApiPlugin(): Plugin {
  return {
    name: "field-api",
    configureServer(server: ViteDevServer) {
      // Vite only injects VITE_* vars into client code; the API reads
      // process.env, so surface the server-side .env/.env.local values here.
      // Named one by one so a .env file cannot set anything else in the dev
      // process — add the key here when a route starts reading a new one.
      const fileEnv = loadEnv(server.config.mode, server.config.envDir || process.cwd(), "");
      for (const key of [
        "ANTHROPIC_API_KEY",
        // Billing: without these the API answers 503 and says which is missing.
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "STAFF_API_TOKEN",
        "PUBLIC_BASE_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        // Project Intelligence gateway.
        "PROJECT_REVIEW_SERVICE_URL",
        "PROJECT_REVIEW_ACCESS_KEY",
      ]) {
        if (!process.env[key] && fileEnv[key]) process.env[key] = fileEnv[key];
      }
      server.middlewares.use(createApp());
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fieldApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || "3000"),
    strictPort: false,
    host: true,
  },
});
