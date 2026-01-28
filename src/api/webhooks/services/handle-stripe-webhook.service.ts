import { verifyWebhookSignature } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { getWebhookSecret } from "@/lib/stripe";
import consola from "consola";
import type { RequestHandler } from "express";
import type Stripe from "stripe";

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      consola.error("Missing Stripe signature header");
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing Stripe signature",
      });
    }

    // Get webhook secret
    const webhookSecret = getWebhookSecret();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(req.body, signature, webhookSecret);
    } catch (error) {
      consola.error("Webhook signature verification failed:", error);
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid signature",
      });
    }

    consola.info(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleSuccessfulDeposit(event);
        break;

      case "checkout.session.async_payment_failed":
        await handleFailedDeposit(event);
        break;

      default:
        consola.info(`Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    consola.error("Error processing webhook:", error);
    // Still return 200 to prevent Stripe from retrying
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Webhook received",
    });
  }
};

/**
 * Handle successful deposit from Stripe Checkout
 */
async function handleSuccessfulDeposit(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  consola.info(`Processing successful deposit for session: ${session.id}`);

  try {
    // Get user ID from metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      consola.error("Missing userId in session metadata");
      return;
    }

    // Get amount (convert from cents to dollars)
    const amount = (session.amount_total || 0) / 100;

    // Start MongoDB transaction
    const mongoSession = await db.wallet.startSession();
    mongoSession.startTransaction();

    try {
      // Get or create wallet
      let wallet = await db.wallet
        .findOne({ user: userId })
        .session(mongoSession);
      if (!wallet) {
        wallet = await db.wallet.create(
          [
            {
              user: userId,
              balance: 0,
              currency: "USD",
            },
          ],
          { session: mongoSession }
        );
        wallet = wallet[0];
      }

      // Update wallet balance and Stripe customer ID
      wallet.balance += amount;
      if (session.customer && !wallet.stripeCustomerId) {
        wallet.stripeCustomerId = session.customer as string;
      }
      await wallet.save({ session: mongoSession });

      // Update transaction record
      const transaction = await db.transaction
        .findOne({
          stripeCheckoutSessionId: session.id,
        })
        .session(mongoSession);

      if (transaction) {
        transaction.status = "completed";
        transaction.stripePaymentIntentId = session.payment_intent as string;
        transaction.completedAt = new Date();
        await transaction.save({ session: mongoSession });
      } else {
        // Create transaction if it doesn't exist (shouldn't happen normally)
        await db.transaction.create(
          [
            {
              type: "deposit",
              amount,
              from: null,
              to: userId,
              status: "completed",
              description: `Wallet deposit of $${amount}`,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string,
              completedAt: new Date(),
            },
          ],
          { session: mongoSession }
        );
      }

      // Commit transaction
      await mongoSession.commitTransaction();

      consola.success(
        `Deposit completed: $${amount} added to user ${userId}'s wallet`
      );
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    consola.error("Error processing successful deposit:", error);
  }
}

/**
 * Handle failed deposit from Stripe Checkout
 */
async function handleFailedDeposit(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  consola.warn(`Payment failed for session: ${session.id}`);

  try {
    // Update transaction record to failed
    const transaction = await db.transaction.findOne({
      stripeCheckoutSessionId: session.id,
    });

    if (transaction) {
      transaction.status = "failed";
      transaction.failureReason = "Payment failed on Stripe";
      await transaction.save();
    }

    consola.info(`Transaction marked as failed for session: ${session.id}`);
  } catch (error) {
    consola.error("Error processing failed deposit:", error);
  }
}
