import express, { type Router } from "express";
import { handleStripeWebhook } from "./services";

export const stripeWebhook: Router = express.Router();

// Stripe webhook endpoint (no auth, signature verified in handler)
// IMPORTANT: This must use express.raw() middleware, not express.json()
stripeWebhook.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
