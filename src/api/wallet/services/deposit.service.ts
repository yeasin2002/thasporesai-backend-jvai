import { createCheckoutSession } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { Deposit } from "../wallet.validation";

export const deposit: RequestHandler<{}, any, Deposit> = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const userEmail = req?.user?.email;
    const { amount } = req.body;

    if (!userId || !userEmail) {
      return sendBadRequest(res, "User not authenticated");
    }

    // Validate amount
    if (amount < 1) {
      return sendBadRequest(res, "Minimum deposit amount is $1");
    }

    if (amount > 10000) {
      return sendBadRequest(res, "Maximum deposit amount is $10,000");
    }

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        currency: "USD",
      });
    }

    // Create Stripe Checkout Session
    const { url, sessionId } = await createCheckoutSession(
      userId,
      amount,
      userEmail,
      wallet.stripeCustomerId
    );

    // Create pending transaction record
    await db.transaction.create({
      type: "deposit",
      amount,
      from: null, // External deposit
      to: userId,
      status: "pending",
      description: `Wallet deposit of $${amount}`,
      stripeCheckoutSessionId: sessionId,
    });

    return sendSuccess(res, 200, "Checkout session created successfully", {
      url,
      sessionId,
      amount,
    });
  } catch (error) {
    console.error("Error creating deposit session:", error);
    return sendInternalError(res, "Failed to create deposit session", error);
  }
};
