/**
 * Shared Express app factory — API routes only (no static serving, no listen).
 * Used by server/index.ts (local/self-hosted: adds static + SPA fallback) and
 * api/index.ts (Vercel serverless function entry).
 */
import express from "express";
import analyseRoute from "./routes/analyse.js";
import fieldRoute from "./routes/field.js";
import brainRoute from "./routes/brain.js";
import reportRoute from "./routes/report.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/analyse-drawing", analyseRoute);
  app.use("/api/field", fieldRoute);
  app.use("/api/brain", brainRoute);
  app.use("/api/report", reportRoute);
  return app;
}
