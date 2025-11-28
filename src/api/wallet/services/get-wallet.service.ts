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
    console.error("Error getting wallet:", error);
    return sendInternalError(res, "Failed to get wallet", error);
  }
};
