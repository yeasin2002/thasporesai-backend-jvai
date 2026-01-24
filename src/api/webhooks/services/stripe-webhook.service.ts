import { db } from "@/db";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/Env";
import { stripe } from "@/lib/stripe";
import type { RequestHandler } from "express";
import Stripe from "stripe";

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("❌ No Stripe signature found in headers");
    return res.status(400).send("No signature found");
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).send("Webhook secret not configured");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
  }

  console.log(`✅ Received Stripe webhook: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return res.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return res.status(500).send("Webhook processing failed");
  }
};

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`💰 Processing successful payment: ${paymentIntent.id}`);

  const { userId, walletId } = paymentIntent.metadata;
  const amount = paymentIntent.amount / 100; // Convert from cents

  if (!userId || !walletId) {
    console.error("❌ Missing metadata in payment intent:", paymentIntent.id);
    return;
  }

  try {
    // Find the transaction
    const transaction = await db.transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!transaction) {
      console.error(
        "❌ Transaction not found for payment intent:",
        paymentIntent.id
      );
      return;
    }

    // Update transaction status
    transaction.status = "completed";
    transaction.stripeStatus = paymentIntent.status;
    transaction.completedAt = new Date();
    await transaction.save();

    // Update wallet
    const wallet = await db.wallet.findById(walletId);
    if (!wallet) {
      console.error("❌ Wallet not found:", walletId);
      return;
    }

    // Add to balance and decrease pending deposits
    wallet.balance += amount;
    wallet.pendingDeposits = Math.max(
      0,
      (wallet.pendingDeposits || 0) - amount
    );
    wallet.lastStripeSync = new Date();
    await wallet.save();

    console.log(`✅ Deposit completed: $${amount} added to wallet ${walletId}`);

    // TODO: Send notification to user about successful deposit
  } catch (error) {
    console.error("❌ Error processing successful payment:", error);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Processing failed payment: ${paymentIntent.id}`);

  const { userId, walletId } = paymentIntent.metadata;
  const amount = paymentIntent.amount / 100;

  if (!userId || !walletId) {
    console.error("❌ Missing metadata in payment intent:", paymentIntent.id);
    return;
  }

  try {
    // Find the transaction
    const transaction = await db.transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!transaction) {
      console.error(
        "❌ Transaction not found for payment intent:",
        paymentIntent.id
      );
      return;
    }

    // Update transaction status
    transaction.status = "failed";
    transaction.stripeStatus = paymentIntent.status;
    transaction.failureReason =
      paymentIntent.last_payment_error?.message || "Payment failed";
    transaction.stripeError = JSON.stringify(paymentIntent.last_payment_error);
    await transaction.save();

    // Update wallet - decrease pending deposits
    const wallet = await db.wallet.findById(walletId);
    if (wallet) {
      wallet.pendingDeposits = Math.max(
        0,
        (wallet.pendingDeposits || 0) - amount
      );
      wallet.lastStripeSync = new Date();
      await wallet.save();
    }

    console.log(`❌ Deposit failed: $${amount} for wallet ${walletId}`);

    // TODO: Send notification to user about failed deposit
  } catch (error) {
    console.error("❌ Error processing failed payment:", error);
    throw error;
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`🚫 Processing canceled payment: ${paymentIntent.id}`);

  const { userId, walletId } = paymentIntent.metadata;
  const amount = paymentIntent.amount / 100;

  if (!userId || !walletId) {
    console.error("❌ Missing metadata in payment intent:", paymentIntent.id);
    return;
  }

  try {
    // Find the transaction
    const transaction = await db.transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!transaction) {
      console.error(
        "❌ Transaction not found for payment intent:",
        paymentIntent.id
      );
      return;
    }

    // Update transaction status
    transaction.status = "failed";
    transaction.stripeStatus = paymentIntent.status;
    transaction.failureReason = "Payment canceled";
    await transaction.save();

    // Update wallet - decrease pending deposits
    const wallet = await db.wallet.findById(walletId);
    if (wallet) {
      wallet.pendingDeposits = Math.max(
        0,
        (wallet.pendingDeposits || 0) - amount
      );
      wallet.lastStripeSync = new Date();
      await wallet.save();
    }

    console.log(`🚫 Deposit canceled: $${amount} for wallet ${walletId}`);

    // TODO: Send notification to user about canceled deposit
  } catch (error) {
    console.error("❌ Error processing canceled payment:", error);
    throw error;
  }
}
