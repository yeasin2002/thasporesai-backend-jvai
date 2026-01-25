import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { stripe } from "@/lib/stripe";
import type { RequestHandler } from "express";
import Stripe from "stripe";

export const getWithdrawalStatus: RequestHandler<{
  transactionId: string;
}> = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { transactionId } = req.params;

    // Validate user authentication
    if (!userId) {
      return sendBadRequest(res, "User not authenticated");
    }

    // Validate transaction ID
    if (!transactionId) {
      return sendBadRequest(res, "Transaction ID is required");
    }

    // Find transaction
    const transaction = await db.transaction.findById(transactionId);

    if (!transaction) {
      return sendBadRequest(res, "Transaction not found");
    }

    // Verify ownership
    if (transaction.from.toString() !== userId.toString()) {
      return sendBadRequest(
        res,
        "You don't have permission to view this transaction"
      );
    }

    // Verify it's a withdrawal
    if (transaction.type !== "withdrawal") {
      return sendBadRequest(res, "This is not a withdrawal transaction");
    }

    // If no Stripe transfer ID, return database status only
    if (!transaction.stripeTransferId) {
      return sendSuccess(res, 200, "Withdrawal status retrieved", {
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          status: transaction.status,
          description: transaction.description,
          completedAt: transaction.completedAt,
          failureReason: transaction.failureReason,
        },
        stripe: null,
      });
    }

    // Fetch transfer details from Stripe
    let transfer: Stripe.Transfer;
    try {
      transfer = await stripe.transfers.retrieve(transaction.stripeTransferId);
    } catch (stripeError) {
      console.error("Error fetching transfer from Stripe:", stripeError);

      // Return database info even if Stripe fetch fails
      return sendSuccess(
        res,
        200,
        "Withdrawal status retrieved (Stripe unavailable)",
        {
          transaction: {
            id: transaction._id,
            amount: transaction.amount,
            status: transaction.status,
            description: transaction.description,
            completedAt: transaction.completedAt,
            failureReason: transaction.failureReason,
            stripeTransferId: transaction.stripeTransferId,
          },
          stripe: {
            error: "Unable to fetch transfer details from Stripe",
          },
        }
      );
    }

    // Combine database and Stripe information
    return sendSuccess(res, 200, "Withdrawal status retrieved successfully", {
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        description: transaction.description,
        completedAt: transaction.completedAt,
        failureReason: transaction.failureReason,
        stripeTransferId: transaction.stripeTransferId,
        stripeStatus: transaction.stripeStatus,
      },
      stripe: {
        id: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency,
        destination: transfer.destination,
        created: new Date(transfer.created * 1000),
        reversed: transfer.reversed,
        reversals: transfer.reversals?.data?.length || 0,
      },
      estimatedArrival:
        transaction.status === "pending"
          ? "2-3 business days"
          : transaction.status === "completed"
            ? "Completed"
            : "Failed",
    });
  } catch (error) {
    // TODO: Integrate with error tracking service (e.g., Sentry) for production monitoring
    // Enhanced error logging with context
    console.error("Error fetching withdrawal status:", {
      operation: "get_withdrawal_status",
      userId: req?.user?.id,
      transactionId: req.params?.transactionId,
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

    return sendInternalError(res, "Failed to fetch withdrawal status", error);
  }
};
