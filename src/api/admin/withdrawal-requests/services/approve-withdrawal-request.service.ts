import { NotificationService } from "@/common/service/notification.service";
import { createConnectTransfer } from "@/common/service/stripe-helpers";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Admin approves withdrawal request
 * Deducts from contractor wallet and initiates Stripe Connect transfer
 */
export const approveWithdrawalRequest: RequestHandler = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return sendBadRequest(res, "Admin ID not found");
    }

    // 1. Get withdrawal request
    const withdrawalRequest = await db.withdrawalRequest.findById(requestId);

    if (!withdrawalRequest) {
      return sendBadRequest(res, "Withdrawal request not found");
    }

    // 2. Validate request is pending
    if (withdrawalRequest.status !== "pending") {
      return sendBadRequest(
        res,
        `Withdrawal request is already ${withdrawalRequest.status}`
      );
    }

    // 3. Get contractor wallet
    const contractorWallet = await db.wallet.findOne({
      user: withdrawalRequest.contractor,
    });

    if (!contractorWallet) {
      return sendBadRequest(res, "Contractor wallet not found");
    }

    // 4. Validate contractor has sufficient balance
    if (contractorWallet.balance < withdrawalRequest.amount) {
      return sendBadRequest(
        res,
        `Insufficient balance. Required: ${withdrawalRequest.amount}, Available: ${contractorWallet.balance}`
      );
    }

    // 5. Validate contractor has Stripe Connect account
    if (!contractorWallet.stripeConnectAccountId) {
      return sendBadRequest(
        res,
        "Contractor has not connected their Stripe account"
      );
    }

    // 6. Start MongoDB transaction for wallet updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 7. Deduct from contractor wallet
      contractorWallet.balance -= withdrawalRequest.amount;
      contractorWallet.totalWithdrawals += withdrawalRequest.amount;
      await contractorWallet.save({ session });

      // 8. Create transaction record
      const transaction = await db.transaction.create(
        [
          {
            type: "withdrawal",
            amount: withdrawalRequest.amount,
            from: withdrawalRequest.contractor,
            to: null,
            status: "pending",
            description: `Withdrawal to bank account: $${withdrawalRequest.amount}`,
          },
        ],
        { session }
      );

      // 9. Update withdrawal request
      withdrawalRequest.status = "approved";
      withdrawalRequest.approvedBy = new mongoose.Types.ObjectId(adminId);
      withdrawalRequest.approvedAt = new Date();
      await withdrawalRequest.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // 10. Initiate Stripe Connect transfer (outside transaction)
      let stripeTransferId: string | null = null;
      try {
        stripeTransferId = await createConnectTransfer(
          contractorWallet.stripeConnectAccountId,
          withdrawalRequest.amount,
          `Withdrawal: $${withdrawalRequest.amount}`
        );

        // Update transaction and withdrawal request with Stripe transfer ID
        await db.transaction.findByIdAndUpdate(transaction[0]._id, {
          stripeTransferId,
          status: "completed",
          completedAt: new Date(),
        });

        await db.withdrawalRequest.findByIdAndUpdate(requestId, {
          stripeTransferId,
        });
      } catch (stripeError) {
        console.error("Stripe transfer failed:", stripeError);
        // Mark transaction as failed but don't rollback DB changes
        await db.transaction.findByIdAndUpdate(transaction[0]._id, {
          status: "failed",
          failureReason:
            stripeError instanceof Error
              ? stripeError.message
              : "Stripe transfer failed",
        });
      }

      // 11. Send notification to contractor (outside transaction)
      await NotificationService.sendToUser({
        userId: withdrawalRequest.contractor.toString(),
        title: "Withdrawal Approved",
        body: `Your withdrawal of $${withdrawalRequest.amount} has been approved and is being processed`,
        type: "general",
        data: {
          requestId: String(withdrawalRequest._id),
          amount: withdrawalRequest.amount.toString(),
          stripeTransferId: stripeTransferId || "",
        },
      });

      return sendSuccess(res, 200, "Withdrawal approved successfully", {
        requestId: String(withdrawalRequest._id),
        stripeTransferId,
        amount: withdrawalRequest.amount,
        status: "approved",
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error approving withdrawal request:", error);
    return sendInternalError(
      res,
      "Failed to approve withdrawal request",
      error
    );
  }
};
