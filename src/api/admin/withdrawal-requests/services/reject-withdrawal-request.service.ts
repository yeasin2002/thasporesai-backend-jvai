import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Admin rejects withdrawal request
 * Updates request status and sends notification to contractor
 */
export const rejectWithdrawalRequest: RequestHandler = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const { reason } = req.body;
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

    // 3. Update withdrawal request
    withdrawalRequest.status = "rejected";
    withdrawalRequest.rejectedBy = new mongoose.Types.ObjectId(adminId);
    withdrawalRequest.rejectedAt = new Date();
    withdrawalRequest.rejectionReason = reason;
    await withdrawalRequest.save();

    // 4. Send notification to contractor
    await NotificationService.sendToUser({
      userId: withdrawalRequest.contractor.toString(),
      title: "Withdrawal Request Rejected",
      body: `Your withdrawal request for $${withdrawalRequest.amount} was rejected. Reason: ${reason}`,
      type: "general",
      data: {
        requestId: String(withdrawalRequest._id),
        amount: withdrawalRequest.amount.toString(),
        reason,
      },
    });

    return sendSuccess(res, 200, "Withdrawal request rejected", {
      requestId: String(withdrawalRequest._id),
      status: "rejected",
      reason,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal request:", error);
    return sendInternalError(res, "Failed to reject withdrawal request", error);
  }
};
