import express, { type Router } from "express";
import { handleStripeWebhook } from "./services/stripe-webhook.service";

export const webhook: Router = express.Router();

// Stripe webhook endpoint - MUST use raw body
webhook.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
