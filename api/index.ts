/**
 * Vercel serverless entry — all /api/* requests are rewritten here
 * (see vercel.json) and handled by the shared Express app.
 */
import { createApp } from "../server/app.js";

const app = createApp();

export default app;
