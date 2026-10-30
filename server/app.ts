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
import billingRoute from "./routes/billing.js";
import checkoutRoute from "./routes/checkout.js";
import stripeWebhookRoute from "./routes/stripe-webhook.js";

export function createApp() {
  const app = express();
  // Stripe verifies the signature against the exact bytes it sent, so the
  // webhook has to be mounted ahead of express.json() — a parsed body fails
  // verification every time.
  app.use("/api/stripe", stripeWebhookRoute);
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/analyse-drawing", analyseRoute);
  app.use("/api/field", fieldRoute);
  app.use("/api/brain", brainRoute);
  app.use("/api/report", reportRoute);
  app.use("/api/billing", billingRoute);
  app.use("/api/checkout", checkoutRoute);
  return app;
}
