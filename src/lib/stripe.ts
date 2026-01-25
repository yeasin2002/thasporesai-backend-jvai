import Stripe from "stripe";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } from "./Env";

// Validate that Stripe secret key is configured
if (!STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is required. Please add it to your .env file."
  );
}

// Initialize Stripe with stable API version
// Note: Stripe recommends managing API versions in Dashboard, not hardcoding
// Using latest stable version as of January 2026
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true, // Enable TypeScript support
  appInfo: {
    name: "JobSphere",
    version: "1.0.0",
  },
});

// Export publishable key for frontend use
export { STRIPE_PUBLISHABLE_KEY };

// Log Stripe initialization (only in development)
if (process.env.NODE_ENV !== "production") {
  console.log("✅ Stripe initialized successfully");
}
