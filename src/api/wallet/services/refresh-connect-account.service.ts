import { db } from "@/db";
import { sendBadRequest, sendInternalError } from "@/helpers";
import { API_BASE_URL } from "@/lib/Env";
import { stripe } from "@/lib/stripe";
import type { RequestHandler } from "express";
import Stripe from "stripe";

/**
 * Handle refresh URL for Stripe Connect onboarding
 * This is called when the onboarding link expires or user needs to restart
 */
export const refreshConnectAccount: RequestHandler = async (req, res) => {
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

    // Check if account exists
    if (!user.stripeAccountId) {
      return sendBadRequest(res, "No Stripe Connect account found");
    }

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${API_BASE_URL}/api/wallet/connect-account/refresh`,
      return_url: `${API_BASE_URL}/api/wallet/connect-account/return`,
      type: "account_onboarding",
    });

    // Redirect to new onboarding URL
    return res.redirect(accountLink.url);
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error refreshing Stripe Connect account link:", {
      operation: "refresh_connect_account",
      userId: req?.user?.id,
      stripeAccountId: req?.user?.stripeAccountId,
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
      "Failed to refresh Stripe Connect account link",
      error
    );
  }
};

/**
 * Handle return URL for Stripe Connect onboarding
 * This is called when user completes or exits onboarding
 */
export const returnConnectAccount: RequestHandler = async (req, res) => {
  try {
    const userId = req?.user?.id;

    // Validate user authentication
    if (!userId) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>User not authenticated. Please log in and try again.</p>
          </body>
        </html>
      `);
    }

    // Get user
    const user = await db.user.findById(userId);
    if (!user || !user.stripeAccountId) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>Stripe Connect account not found.</p>
          </body>
        </html>
      `);
    }

    // Fetch account to check status
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const onboardingComplete =
      account.details_submitted && account.charges_enabled;

    if (onboardingComplete) {
      // Update user status
      user.stripeAccountStatus = "verified";
      await user.save();

      return res.send(`
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              h1 { color: #00D924; }
              p { color: #333; line-height: 1.6; }
              .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #00D924;
                color: white;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <h1>✅ Onboarding Complete!</h1>
            <p>Your Stripe Connect account has been successfully set up.</p>
            <p>You can now receive payments for completed jobs.</p>
            <a href="#" class="button">Return to App</a>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              h1 { color: #FFA500; }
              p { color: #333; line-height: 1.6; }
              .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #007AFF;
                color: white;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <h1>⚠️ Onboarding Incomplete</h1>
            <p>Your Stripe Connect account setup is not yet complete.</p>
            <p>Please complete all required information to start receiving payments.</p>
            <a href="/api/wallet/connect-account/refresh" class="button">Continue Onboarding</a>
          </body>
        </html>
      `);
    }
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error handling Stripe Connect return:", {
      operation: "return_connect_account",
      userId: req?.user?.id,
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

    return res.status(500).send(`
      <html>
        <body>
          <h1>Error</h1>
          <p>An error occurred. Please try again later.</p>
        </body>
      </html>
    `);
  }
};
