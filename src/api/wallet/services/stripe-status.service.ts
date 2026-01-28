import { getConnectAccountStatus } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Check Stripe Connect account status for contractor
 * Returns account status, payout status, and requirements
 */
export const stripeStatus: RequestHandler = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    // Only contractors can check status
    if (userRole !== "contractor") {
      return sendBadRequest(
        res,
        "Only contractors can check Stripe account status"
      );
    }

    // Get wallet
    const wallet = await db.wallet.findOne({ user: userId });

    if (!wallet) {
      return sendBadRequest(res, "Wallet not found");
    }

    // Check if contractor has Stripe Connect account
    if (!wallet.stripeConnectAccountId) {
      return sendSuccess(res, 200, "Stripe account status retrieved", {
        accountId: null,
        status: "not_connected",
        payoutsEnabled: false,
        requirementsNeeded: [],
        message: "No Stripe account connected. Please complete onboarding.",
      });
    }

    // Get account status from Stripe
    try {
      const status = await getConnectAccountStatus(
        wallet.stripeConnectAccountId
      );

      return sendSuccess(res, 200, "Stripe account status retrieved", {
        accountId: wallet.stripeConnectAccountId,
        status: status.status,
        payoutsEnabled: status.payoutsEnabled,
        requirementsNeeded: status.requirementsNeeded,
      });
    } catch (error) {
      console.error("Error getting Stripe account status:", error);
      return sendInternalError(
        res,
        "Failed to get Stripe account status",
        error
      );
    }
  } catch (error) {
    console.error("Error checking Stripe status:", error);
    return sendInternalError(res, "Failed to check Stripe status", error);
  }
};
