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

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      // Note: Stripe doesn't have transfer.paid/failed events in standard webhooks
      // Transfers are typically instant, but we handle them for completeness
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);

        // Handle transfer events manually if they come through
        if (event.type.startsWith("transfer.")) {
          const transfer = event.data.object as Stripe.Transfer;
          if (event.type === "transfer.created") {
            console.log(`💸 Transfer created: ${transfer.id}`);
          } else if (event.type === "transfer.updated") {
            console.log(`🔄 Transfer updated: ${transfer.id}`);
          } else if (event.type === "transfer.reversed") {
            await handleTransferReversed(transfer);
          }
        }
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

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`🔄 Processing account update: ${account.id}`);

  try {
    // Find user by Stripe account ID
    const user = await db.user.findOne({ stripeAccountId: account.id });

    if (!user) {
      console.error("❌ User not found for account:", account.id);
      return;
    }

    // Check if onboarding is complete
    const onboardingComplete =
      account.details_submitted && account.charges_enabled;

    // Determine account status
    let accountStatus: "pending" | "verified" | "rejected" = "pending";

    if (onboardingComplete) {
      accountStatus = "verified";
    } else if (
      account.requirements?.disabled_reason === "rejected.fraud" ||
      account.requirements?.disabled_reason === "rejected.terms_of_service" ||
      account.requirements?.disabled_reason === "rejected.listed" ||
      account.requirements?.disabled_reason === "rejected.other"
    ) {
      accountStatus = "rejected";
    }

    // Update user status if changed
    const statusChanged = user.stripeAccountStatus !== accountStatus;
    if (statusChanged) {
      const oldStatus = user.stripeAccountStatus;
      user.stripeAccountStatus = accountStatus;
      await user.save();

      console.log(
        `✅ Account status updated for user ${user._id}: ${oldStatus} → ${accountStatus}`
      );

      // TODO: Send notification to user about account status change
      if (accountStatus === "verified") {
        console.log(`🎉 Contractor ${user.email} can now receive payments!`);
        // TODO: Send "Account Verified" notification
      } else if (accountStatus === "rejected") {
        console.log(
          `⚠️ Contractor ${user.email} account was rejected: ${account.requirements?.disabled_reason}`
        );
        // TODO: Send "Account Rejected" notification with reason
      }
    }

    // Log requirements if any
    if (account.requirements?.currently_due?.length) {
      console.log(
        `⚠️ Account ${account.id} has pending requirements:`,
        account.requirements.currently_due
      );
    }
  } catch (error) {
    console.error("❌ Error processing account update:", error);
    throw error;
  }
}

/**
 * Handle successful transfer (withdrawal completed)
 */
async function handleTransferPaid(transfer: Stripe.Transfer) {
  console.log(`💸 Processing successful transfer: ${transfer.id}`);

  const { userId, walletId } = transfer.metadata;
  const amount = transfer.amount / 100; // Convert from cents

  if (!userId || !walletId) {
    console.error("❌ Missing metadata in transfer:", transfer.id);
    return;
  }

  try {
    // Find the transaction
    const transaction = await db.transaction.findOne({
      stripeTransferId: transfer.id,
    });

    if (!transaction) {
      console.error("❌ Transaction not found for transfer:", transfer.id);
      return;
    }

    // Update transaction status
    transaction.status = "completed";
    transaction.stripeStatus = "paid";
    transaction.completedAt = new Date();
    await transaction.save();

    console.log(
      `✅ Withdrawal completed: $${amount} transferred to contractor ${userId}`
    );

    // TODO: Send notification to contractor about successful withdrawal
  } catch (error) {
    console.error("❌ Error processing successful transfer:", error);
    throw error;
  }
}

/**
 * Handle failed transfer (withdrawal failed)
 */
async function handleTransferFailed(transfer: Stripe.Transfer) {
  console.log(`❌ Processing failed transfer: ${transfer.id}`);

  const { userId, walletId } = transfer.metadata;
  const amount = transfer.amount / 100;

  if (!userId || !walletId) {
    console.error("❌ Missing metadata in transfer:", transfer.id);
    return;
  }

  try {
    // Find the transaction
    const transaction = await db.transaction.findOne({
      stripeTransferId: transfer.id,
    });

    if (!transaction) {
      console.error("❌ Transaction not found for transfer:", transfer.id);
      return;
    }

    // Update transaction status
    transaction.status = "failed";
    transaction.stripeStatus = "failed";
    transaction.failureReason = "Transfer failed";
    transaction.stripeError = JSON.stringify(transfer);
    await transaction.save();

    // Refund amount to wallet
    const wallet = await db.wallet.findById(walletId);
    if (wallet) {
      wallet.balance += amount;
      wallet.totalWithdrawals = Math.max(0, wallet.totalWithdrawals - amount);
      await wallet.save();

      console.log(
        `✅ Refunded $${amount} to wallet ${walletId} due to failed transfer`
      );
    }

    console.log(`❌ Withdrawal failed: $${amount} for user ${userId}`);

    // TODO: Send notification to contractor about failed withdrawal
  } catch (error) {
    console.error("❌ Error processing failed transfer:", error);
    throw error;
  }
}

/**
 * Handle reversed transfer (withdrawal reversed/refunded)
 */
async function handleTransferReversed(transfer: Stripe.Transfer) {
  console.log(`🔄 Processing reversed transfer: ${transfer.id}`);

  const { userId, walletId } = transfer.metadata;
  const amount = transfer.amount / 100;

  if (!userId || !walletId) {
    console.error("❌ Missing metadata in transfer:", transfer.id);
    return;
  }

  try {
    // Find the transaction
    const transaction = await db.transaction.findOne({
      stripeTransferId: transfer.id,
    });

    if (!transaction) {
      console.error("❌ Transaction not found for transfer:", transfer.id);
      return;
    }

    // Update transaction status
    transaction.status = "failed";
    transaction.stripeStatus = "reversed";
    transaction.failureReason = "Transfer reversed";
    await transaction.save();

    // Refund amount to wallet
    const wallet = await db.wallet.findById(walletId);
    if (wallet) {
      wallet.balance += amount;
      wallet.totalWithdrawals = Math.max(0, wallet.totalWithdrawals - amount);
      await wallet.save();

      console.log(
        `✅ Refunded $${amount} to wallet ${walletId} due to reversed transfer`
      );
    }

    console.log(`🔄 Withdrawal reversed: $${amount} for user ${userId}`);

    // TODO: Send notification to contractor about reversed withdrawal
  } catch (error) {
    console.error("❌ Error processing reversed transfer:", error);
    throw error;
  }
}
