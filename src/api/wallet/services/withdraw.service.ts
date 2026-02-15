import { getConnectAccountStatus } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendBadRequest, sendCreated, sendInternalError } from "@/helpers";
import type { RequestHandler } from "express";
import type { Withdraw } from "../wallet.validation";

/**
 * Contractor requests withdrawal
 * Creates a WithdrawalRequest with status "pending" for admin approval
 */
export const withdraw: RequestHandler<{}, any, Withdraw> = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { amount } = req.body;

    // Only contractors can withdraw
    if (req?.user?.role !== "contractor") {
      return sendBadRequest(res, "Only contractors can withdraw funds");
    }

    // Minimum withdrawal amount
    if (amount < 10) {
      return sendBadRequest(res, "Minimum withdrawal amount is $10");
    }

    // Maximum withdrawal amount (for security)
    if (amount > 10000) {
      return sendBadRequest(res, "Maximum withdrawal amount is $10,000");
    }

    // Get wallet
    const wallet = await db.wallet.findOne({ user: userId });

    if (!wallet) {
      return sendBadRequest(res, "Wallet not found");
    }

    // Check if wallet is frozen
    if (wallet.isFrozen) {
      return sendBadRequest(res, "Wallet is frozen. Please contact support.");
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: ${amount}, Available: ${wallet.balance}`
      );
    }

    // Check if contractor has Stripe Connect account
    if (!wallet.stripeConnectAccountId) {
      return sendBadRequest(
        res,
        "Please connect your Stripe account before requesting withdrawal"
      );
    }

    // Verify Stripe Connect account is verified
    try {
      const connectStatus = await getConnectAccountStatus(
        wallet.stripeConnectAccountId
      );

      if (connectStatus.status !== "verified") {
        return sendBadRequest(
          res,
          `Your Stripe account is ${connectStatus.status}. Please complete verification before requesting withdrawal.`
        );
      }

      if (!connectStatus.payoutsEnabled) {
        return sendBadRequest(
          res,
          "Payouts are not enabled on your Stripe account. Please complete verification."
        );
      }
    } catch (error) {
      console.error("Error checking Stripe Connect status:", error);
      return sendBadRequest(
        res,
        "Unable to verify your Stripe account. Please try again later."
      );
    }

    // Create withdrawal request
    const withdrawalRequest = await db.withdrawalRequest.create({
      contractor: userId,
      amount,
      status: "pending",
    });

    return sendCreated(res, "Withdrawal request created successfully", {
      requestId: String(withdrawalRequest._id),
      amount,
      status: "pending",
      message:
        "Your withdrawal request has been submitted and is pending admin approval",
    });
  } catch (error) {
    console.error("Error processing withdrawal request:", error);
    return sendInternalError(
      res,
      "Failed to process withdrawal request",
      error
    );
  }
};
