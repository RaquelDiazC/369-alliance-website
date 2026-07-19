import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import express from "express";
import fieldRoute from "./server/routes/field";
import brainRoute from "./server/routes/brain";

// Exposes the field-inspector + legislation-brain APIs during `pnpm dev`
// (prod mounts them in server/index.ts).
function fieldApiPlugin(): Plugin {
  return {
    name: "field-api",
    configureServer(server: ViteDevServer) {
      // Vite only injects VITE_* vars into client code; the API middleware reads
      // process.env, so surface .env/.env.local values (ANTHROPIC_API_KEY) here.
      const fileEnv = loadEnv(server.config.mode, server.config.envDir || process.cwd(), "");
      if (!process.env.ANTHROPIC_API_KEY && fileEnv.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = fileEnv.ANTHROPIC_API_KEY;
      }
      const app = express();
      app.use(express.json({ limit: "10mb" }));
      app.use("/api/field", fieldRoute);
      app.use("/api/brain", brainRoute);
      server.middlewares.use(app);
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
