import consola from "consola";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Initialize Stripe SDK
 * Uses STRIPE_SECRET_KEY from environment variables
 */
export const initializeStripe = (): Stripe => {
  if (stripeInstance) {
    return stripeInstance;
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not defined in environment variables. Please add it to your .env file."
      );
    }

    // Initialize Stripe with secret key
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2025-10-29.clover", // Use latest API version
      typescript: true,
    });

    consola.success("✓ Stripe SDK initialized successfully");
    return stripeInstance;
  } catch (error) {
    consola.error("❌ Failed to initialize Stripe SDK:", error);
    consola.warn(
      "⚠️ Stripe initialization failed. Payment features will not work."
    );
    throw error;
  }
};

/**
 * Get Stripe instance
 * Initializes Stripe if not already initialized
 */
export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    return initializeStripe();
  }
  return stripeInstance;
};

/**
 * Get webhook secret from environment
 */
export const getWebhookSecret = (): string => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not defined in environment variables. Please add it to your .env file."
    );
  }

  return webhookSecret;
};
