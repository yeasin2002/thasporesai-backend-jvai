import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { stripe } from "@/lib/stripe";
import { randomUUID } from "crypto";
import type { RequestHandler } from "express";
import Stripe from "stripe";
import type { Deposit } from "../wallet.validation";

export const deposit: RequestHandler<{}, any, Deposit> = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { amount, paymentMethodId } = req.body;

    // Validate user authentication
    if (!userId) {
      return sendBadRequest(res, "User not authenticated");
    }

    // Validate amount
    if (amount < 10) {
      return sendBadRequest(res, "Minimum deposit amount is $10");
    }

    // Generate idempotency key for this deposit
    const idempotencyKey = randomUUID();

    // Get user
    const user = await db.user.findById(userId);
    if (!user) {
      return sendBadRequest(res, "User not found");
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: userId.toString(),
        },
      });

      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        escrowBalance: 0,
        pendingDeposits: 0,
      });
    }

    // Check for existing transaction with same idempotency key
    const existingTransaction = await db.transaction.findOne({
      idempotencyKey,
    });

    if (existingTransaction) {
      console.log(
        `⚠️ Duplicate deposit request detected with idempotency key: ${idempotencyKey}`
      );

      // Return existing transaction details
      return sendSuccess(res, 200, "Deposit already processed", {
        transaction: {
          id: existingTransaction._id,
          amount: existingTransaction.amount,
          status: existingTransaction.status,
        },
        wallet: {
          balance: wallet.balance,
          pendingDeposits: wallet.pendingDeposits,
        },
      });
    }

    // Create Payment Intent with idempotency key
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true, // Automatically confirm the payment
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          userId: userId.toString(),
          walletId: String(wallet._id),
          type: "deposit",
          idempotencyKey,
        },
      },
      {
        idempotencyKey, // Pass idempotency key to Stripe
      }
    );

    // Create pending transaction record with idempotency key
    const transaction = await db.transaction.create({
      type: "deposit",
      amount,
      from: userId,
      to: userId,
      status: "pending",
      description: `Wallet deposit of $${amount}`,
      stripePaymentIntentId: paymentIntent.id,
      stripeStatus: paymentIntent.status,
      idempotencyKey,
    });

    // Update wallet pending deposits
    wallet.pendingDeposits = (wallet.pendingDeposits || 0) + amount;
    await wallet.save();

    return sendSuccess(res, 200, "Payment initiated successfully", {
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        clientSecret: paymentIntent.client_secret,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
      },
      wallet: {
        balance: wallet.balance,
        pendingDeposits: wallet.pendingDeposits,
      },
    });
  } catch (error) {
    // Enhanced error logging with context
    console.error("Error processing deposit:", {
      operation: "deposit",
      userId: req?.user?.id,
      amount: req.body?.amount,
      paymentMethodId: req.body?.paymentMethodId,
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

    return sendInternalError(res, "Failed to process deposit", error);
  }
};
