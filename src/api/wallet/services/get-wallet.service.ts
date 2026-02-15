import { getConnectAccountStatus } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getWallet: RequestHandler = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    // Get or create wallet
    let wallet = await db.wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await db.wallet.create({
        user: userId,
        balance: 0,
        currency: "USD",
      });
    }

    // Get Stripe Connect status for contractors
    let stripeConnectStatus:
      | "not_connected"
      | "pending"
      | "verified"
      | "restricted" = "not_connected";

    if (userRole === "contractor" && wallet.stripeConnectAccountId) {
      try {
        const status = await getConnectAccountStatus(
          wallet.stripeConnectAccountId
        );
        stripeConnectStatus = status.status;
      } catch (error) {
        console.error("Error getting Stripe Connect status:", error);
        // Continue with default status
      }
    }

    return sendSuccess(res, 200, "Wallet retrieved successfully", {
      balance: wallet.balance,
      currency: wallet.currency,
      totalEarnings: wallet.totalEarnings,
      totalSpent: wallet.totalSpent,
      totalWithdrawals: wallet.totalWithdrawals,
      isActive: wallet.isActive,
      isFrozen: wallet.isFrozen,
      stripeConnectStatus,
    });
  } catch (error) {
    console.error("Error getting wallet:", error);
    return sendInternalError(res, "Failed to get wallet", error);
  }
};
