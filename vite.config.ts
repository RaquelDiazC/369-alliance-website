import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import express from "express";
import fieldRoute from "./server/routes/field";

// Exposes the field-inspector API during `pnpm dev` (prod mounts it in server/index.ts).
function fieldApiPlugin(): Plugin {
  return {
    name: "field-api",
    configureServer(server: ViteDevServer) {
      const app = express();
      app.use(express.json({ limit: "10mb" }));
      app.use("/api/field", fieldRoute);
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
