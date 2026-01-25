import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getWallet: RequestHandler = async (req, res) => {
  try {
    const userId = req?.user?.id;

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        escrowBalance: 0,
        currency: "USD",
      });
    }

    return sendSuccess(res, 200, "Wallet retrieved successfully", wallet);
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error getting wallet:", {
      operation: "get_wallet",
      userId: req?.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return sendInternalError(res, "Failed to get wallet", error);
  }
};
