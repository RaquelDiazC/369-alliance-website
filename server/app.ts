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
import projectReviewRoute from "./routes/project-review.js";
import billingRoute, { publicRouter as billingPublicRoute } from "./routes/billing.js";
import checkoutRoute from "./routes/checkout.js";
import stripeWebhookRoute from "./routes/stripe-webhook.js";

export function createApp() {
  const app = express();
  // Two routers go ahead of express.json(), for opposite reasons. Stripe
  // verifies the signature against the exact bytes it sent, so a parsed body
  // fails verification every time; project-review parses its own JSON at 45 mb,
  // so the payloads that screen sends do not raise the limit for every route.
  app.use("/api/stripe", stripeWebhookRoute);
  app.use("/api/project-review", projectReviewRoute);
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/analyse-drawing", analyseRoute);
  app.use("/api/field", fieldRoute);
  app.use("/api/brain", brainRoute);
  app.use("/api/report", reportRoute);
  // Client-facing token links first: the billing router below requires a staff
  // token for everything it serves. If these two are ever swapped the public
  // links start demanding auth — wrong, but closed rather than open.
  app.use("/api/billing/public", billingPublicRoute);
  app.use("/api/billing", billingRoute);
  app.use("/api/checkout", checkoutRoute);
  return app;
}
