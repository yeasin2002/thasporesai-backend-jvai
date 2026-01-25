import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { stripe } from "@/lib/stripe";
import { randomUUID } from "crypto";
import type { RequestHandler } from "express";
import Stripe from "stripe";
import type { Withdraw } from "../wallet.validation";

export const withdraw: RequestHandler<{}, any, Withdraw> = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { amount } = req.body;

    // Validate user authentication
    if (!userId) {
      return sendBadRequest(res, "User not authenticated");
    }

    // Only contractors can withdraw
    if (req?.user?.role !== "contractor") {
      return sendBadRequest(res, "Only contractors can withdraw funds");
    }

    // Minimum withdrawal amount
    if (amount < 10) {
      return sendBadRequest(res, "Minimum withdrawal amount is $10");
    }

    // Maximum withdrawal amount (for security)
    if (amount > 10000) {
      return sendBadRequest(res, "Maximum withdrawal amount is $10,000");
    }

    // Generate idempotency key for this withdrawal
    const idempotencyKey = randomUUID();

    // Get user to check Stripe account
    const user = await db.user.findById(userId);
    if (!user) {
      return sendBadRequest(res, "User not found");
    }

    // Check if contractor has Stripe Connect account
    if (!user.stripeAccountId) {
      return sendBadRequest(
        res,
        "Please complete Stripe Connect onboarding before withdrawing funds"
      );
    }

    // Check if onboarding is complete
    if (user.stripeAccountStatus !== "verified") {
      return sendBadRequest(
        res,
        `Stripe Connect account is ${user.stripeAccountStatus || "pending"}. Please complete onboarding to withdraw funds.`
      );
    }

    // Verify account is still active in Stripe
    try {
      const account = await stripe.accounts.retrieve(user.stripeAccountId);

      if (!account.charges_enabled || !account.payouts_enabled) {
        return sendBadRequest(
          res,
          "Your Stripe account is not fully activated. Please complete any pending requirements."
        );
      }
    } catch (stripeError) {
      console.error("Error verifying Stripe account:", stripeError);
      return sendBadRequest(
        res,
        "Unable to verify Stripe account. Please contact support."
      );
    }

    // Get wallet
    const existingWallet = await db.wallet.findOne({ user: userId });
    if (!existingWallet) {
      return sendBadRequest(res, "Wallet not found");
    }

    // Check wallet is not frozen
    if (existingWallet.isFrozen) {
      return sendBadRequest(res, "Wallet is frozen. Please contact support.");
    }

    // Check sufficient balance
    if (existingWallet.balance < amount) {
      return sendBadRequest(
        res,
        `Insufficient balance. Available: $${existingWallet.balance}`
      );
    }

    // Check for existing transaction with same idempotency key
    const existingTransaction = await db.transaction.findOne({
      idempotencyKey,
    });

    if (existingTransaction) {
      console.log(
        `⚠️ Duplicate withdrawal request detected with idempotency key: ${idempotencyKey}`
      );

      // Return existing transaction details
      return sendSuccess(res, 200, "Withdrawal already processed", {
        transaction: {
          id: existingTransaction._id,
          amount: existingTransaction.amount,
          status: existingTransaction.status,
          stripeTransferId: existingTransaction.stripeTransferId,
        },
        wallet: {
          balance: existingWallet.balance,
          totalWithdrawals: existingWallet.totalWithdrawals,
        },
      });
    }

    // Create Stripe Transfer with idempotency key
    let transfer: Stripe.Transfer;
    try {
      transfer = await stripe.transfers.create(
        {
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          destination: user.stripeAccountId,
          metadata: {
            userId: userId.toString(),
            walletId: String(existingWallet._id),
            type: "withdrawal",
            idempotencyKey,
          },
        },
        {
          idempotencyKey, // Pass idempotency key to Stripe
        }
      );
    } catch (stripeError) {
      console.error("Error creating Stripe transfer:", stripeError);

      if (stripeError instanceof Stripe.errors.StripeError) {
        return sendBadRequest(res, `Transfer failed: ${stripeError.message}`);
      }

      return sendInternalError(res, "Failed to create transfer", stripeError);
    }

    // Atomically update wallet with balance check (prevents race conditions)
    const wallet = await db.wallet.findOneAndUpdate(
      {
        user: userId,
        balance: { $gte: amount }, // Atomic check - ensures sufficient balance
        isFrozen: false, // Also check wallet is not frozen
      },
      {
        $inc: {
          balance: -amount,
          totalWithdrawals: amount,
        },
      },
      { new: true }
    );

    // If wallet update failed, we need to cancel the transfer
    if (!wallet) {
      // Attempt to reverse the transfer
      try {
        await stripe.transfers.createReversal(transfer.id);
        console.log(
          `✅ Transfer ${transfer.id} reversed due to wallet update failure`
        );
      } catch (reversalError) {
        console.error("❌ Failed to reverse transfer:", reversalError);
        // Log this critical error - manual intervention may be needed
      }

      return sendBadRequest(
        res,
        `Insufficient balance. Available: $${existingWallet.balance}`
      );
    }

    // Create pending transaction record with idempotency key
    const transaction = await db.transaction.create({
      type: "withdrawal",
      amount,
      from: userId,
      to: userId,
      status: "pending",
      description: `Withdrawal of $${amount} to bank account`,
      stripeTransferId: transfer.id,
      stripeStatus: "pending",
      idempotencyKey,
    });

    console.log(
      `✅ Withdrawal initiated: $${amount} for user ${userId}, transfer ${transfer.id}`
    );

    return sendSuccess(res, 200, "Withdrawal initiated successfully", {
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        stripeTransferId: transfer.id,
      },
      wallet: {
        balance: wallet.balance,
        totalWithdrawals: wallet.totalWithdrawals,
      },
      estimatedArrival: "2-3 business days",
      message:
        "Your withdrawal is being processed. Funds will arrive in your bank account within 2-3 business days.",
    });
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error processing withdrawal:", {
      operation: "withdrawal",
      userId: req?.user?.id,
      amount: req.body?.amount,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      stripeError:
        error instanceof Stripe.errors.StripeError
          ? {
              type: error.type,
              code: error.code,
              statusCode: error.statusCode,
              requestId: error.requestId,
            }
          : undefined,
    });

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return sendBadRequest(res, error.message);
    }

    return sendInternalError(res, "Failed to process withdrawal", error);
  }
};
