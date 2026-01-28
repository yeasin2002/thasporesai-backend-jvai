import {
  createConnectOnboardingLink,
  getOrCreateConnectAccount,
} from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Get Stripe Connect onboarding link for contractor
 * Creates Connect account if doesn't exist, generates onboarding link
 */
export const stripeOnboard: RequestHandler = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const userRole = req?.user?.role;
    const { refreshUrl, returnUrl } = req.body;

    if (!userId) {
      return sendBadRequest(res, "User ID not found");
    }

    // Only contractors can onboard
    if (userRole !== "contractor") {
      return sendBadRequest(res, "Only contractors can connect Stripe account");
    }

    // Get user email
    const user = await db.user.findById(userId);
    if (!user) {
      return sendBadRequest(res, "User not found");
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

    // Get or create Stripe Connect account
    let accountId = wallet.stripeConnectAccountId;

    if (!accountId) {
      // Create new Connect account
      accountId = await getOrCreateConnectAccount(userId, user.email);

      // Save account ID to wallet
      wallet.stripeConnectAccountId = accountId;
      await wallet.save();
    }

    // Generate onboarding link
    const onboardingUrl = await createConnectOnboardingLink(
      accountId,
      refreshUrl || `${process.env.CLIENT_URL}/wallet/stripe/refresh`,
      returnUrl || `${process.env.CLIENT_URL}/wallet/stripe/return`
    );

    return sendSuccess(res, 200, "Onboarding link created successfully", {
      url: onboardingUrl,
      accountId,
    });
  } catch (error) {
    console.error("Error creating onboarding link:", error);
    return sendInternalError(res, "Failed to create onboarding link", error);
  }
};
