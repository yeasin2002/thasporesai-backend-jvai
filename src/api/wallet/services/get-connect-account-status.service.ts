import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { stripe } from "@/lib/stripe";
import type { RequestHandler } from "express";
import Stripe from "stripe";

export const getConnectAccountStatus: RequestHandler = async (req, res) => {
  let user;
  try {
    const userId = req?.user?.id;

    // Validate user authentication
    if (!userId) {
      return sendBadRequest(res, "User not authenticated");
    }

    // Get user
    user = await db.user.findById(userId);
    if (!user) {
      return sendBadRequest(res, "User not found");
    }

    // Verify user is a contractor
    if (user.role !== "contractor") {
      return sendBadRequest(
        res,
        "Only contractors can check Stripe Connect account status"
      );
    }

    // Check if account exists
    if (!user.stripeAccountId) {
      return sendSuccess(res, 200, "No Stripe Connect account found", {
        hasAccount: false,
        accountId: null,
        status: null,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        message: "Please create a Stripe Connect account to receive payments",
      });
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Check onboarding completion
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
    if (user.stripeAccountStatus !== accountStatus) {
      user.stripeAccountStatus = accountStatus;
      await user.save();
    }

    return sendSuccess(
      res,
      200,
      "Stripe Connect account status retrieved successfully",
      {
        hasAccount: true,
        accountId: account.id,
        status: accountStatus,
        onboardingComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
          pendingVerification: account.requirements?.pending_verification || [],
          disabledReason: account.requirements?.disabled_reason || null,
        },
        capabilities: {
          transfers: account.capabilities?.transfers,
        },
      }
    );
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error fetching Stripe Connect account status:", {
      operation: "get_connect_account_status",
      userId: req?.user?.id,
      stripeAccountId: user?.stripeAccountId,
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

    return sendInternalError(
      res,
      "Failed to fetch Stripe Connect account status",
      error
    );
  }
};
