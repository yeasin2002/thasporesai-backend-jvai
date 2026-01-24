import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { API_BASE_URL } from "@/lib/Env";
import { stripe } from "@/lib/stripe";
import type { RequestHandler } from "express";
import Stripe from "stripe";

export const createConnectAccount: RequestHandler = async (req, res) => {
  try {
    const userId = req?.user?.id;

    // Validate user authentication
    if (!userId) {
      return sendBadRequest(res, "User not authenticated");
    }

    // Get user
    const user = await db.user.findById(userId);
    if (!user) {
      return sendBadRequest(res, "User not found");
    }

    // Verify user is a contractor
    if (user.role !== "contractor") {
      return sendBadRequest(
        res,
        "Only contractors can create Stripe Connect accounts"
      );
    }

    // Check if account already exists
    if (user.stripeAccountId) {
      // Fetch existing account details
      const account = await stripe.accounts.retrieve(user.stripeAccountId);

      // Check if onboarding is complete
      const onboardingComplete =
        account.details_submitted && account.charges_enabled;

      if (onboardingComplete) {
        return sendSuccess(res, 200, "Stripe Connect account already exists", {
          accountId: user.stripeAccountId,
          status: user.stripeAccountStatus || "verified",
          onboardingComplete: true,
        });
      }

      // If onboarding not complete, create new onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${API_BASE_URL}/api/wallet/connect-account/refresh`,
        return_url: `${API_BASE_URL}/api/wallet/connect-account/return`,
        type: "account_onboarding",
      });

      return sendSuccess(
        res,
        200,
        "Please complete your Stripe Connect onboarding",
        {
          accountId: user.stripeAccountId,
          onboardingUrl: accountLink.url,
          onboardingComplete: false,
        }
      );
    }

    // Create new Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // TODO: Make this dynamic based on user location
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        userId: userId.toString(),
        userEmail: user.email,
        userName: user.full_name,
      },
    });

    // Save account ID to user document
    user.stripeAccountId = account.id;
    user.stripeAccountStatus = "pending";
    await user.save();

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${API_BASE_URL}/api/wallet/connect-account/refresh`,
      return_url: `${API_BASE_URL}/api/wallet/connect-account/return`,
      type: "account_onboarding",
    });

    console.log(
      `✅ Stripe Connect account created for user ${userId}: ${account.id}`
    );

    return sendSuccess(
      res,
      201,
      "Stripe Connect account created successfully",
      {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        expiresAt: accountLink.expires_at,
        message:
          "Please complete the onboarding process to start receiving payments",
      }
    );
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return sendBadRequest(res, error.message);
    }

    return sendInternalError(
      res,
      "Failed to create Stripe Connect account",
      error
    );
  }
};
