import { getStripe } from "@/lib/stripe";
import consola from "consola";
import type Stripe from "stripe";

/**
 * Create Stripe Checkout Session for customer deposit
 * Returns the session URL for the customer to complete payment in browser
 */
export const createCheckoutSession = async (
  userId: string,
  amount: number,
  customerEmail: string,
  stripeCustomerId?: string | null
): Promise<{ url: string; sessionId: string }> => {
  try {
    const stripe = getStripe();

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Wallet Deposit",
              description: `Add funds to your JobSphere wallet`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/wallet?deposit=success`,
      cancel_url: `${process.env.CLIENT_URL}/wallet?deposit=cancelled`,
      customer: stripeCustomerId || undefined,
      customer_email: !stripeCustomerId ? customerEmail : undefined,
      metadata: {
        userId,
        type: "wallet_deposit",
      },
    });

    if (!session.url) {
      throw new Error("Checkout session URL not generated");
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    consola.error("Error creating Checkout Session:", error);
    throw error;
  }
};

/**
 * Create or retrieve Stripe Connect account for contractor
 */
export const getOrCreateConnectAccount = async (
  contractorId: string,
  email: string
): Promise<string> => {
  try {
    const stripe = getStripe();

    // Create new Connect account
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        contractorId,
      },
    });

    return account.id;
  } catch (error) {
    consola.error("Error creating Connect account:", error);
    throw error;
  }
};

/**
 * Generate Stripe Connect onboarding link
 */
export const createConnectOnboardingLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> => {
  try {
    const stripe = getStripe();

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return accountLink.url;
  } catch (error) {
    consola.error("Error creating onboarding link:", error);
    throw error;
  }
};

/**
 * Get Stripe Connect account status
 */
export const getConnectAccountStatus = async (
  accountId: string
): Promise<{
  status: "not_connected" | "pending" | "verified" | "restricted";
  payoutsEnabled: boolean;
  requirementsNeeded: string[];
}> => {
  try {
    const stripe = getStripe();

    const account = await stripe.accounts.retrieve(accountId);

    // Determine status
    let status: "not_connected" | "pending" | "verified" | "restricted" =
      "pending";

    if (account.charges_enabled && account.payouts_enabled) {
      status = "verified";
    } else if (
      account.requirements?.disabled_reason ||
      account.requirements?.errors?.length
    ) {
      status = "restricted";
    }

    return {
      status,
      payoutsEnabled: account.payouts_enabled || false,
      requirementsNeeded: account.requirements?.currently_due || [],
    };
  } catch (error) {
    consola.error("Error getting Connect account status:", error);
    throw error;
  }
};

/**
 * Create Stripe Connect transfer to contractor
 */
export const createConnectTransfer = async (
  accountId: string,
  amount: number,
  description: string
): Promise<string> => {
  try {
    const stripe = getStripe();

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      destination: accountId,
      description,
    });

    return transfer.id;
  } catch (error) {
    consola.error("Error creating Connect transfer:", error);
    throw error;
  }
};

/**
 * Verify Stripe webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event => {
  try {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    consola.error("Webhook signature verification failed:", error);
    throw error;
  }
};
