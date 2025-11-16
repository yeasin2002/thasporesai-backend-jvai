import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Customer cancels a sent invite
 * DELETE /api/job-invite/:inviteId
 */
export const cancelInvite: RequestHandler = async (req, res) => {
	try {
		const inviteId = req.params.inviteId;
		const customerId = req.user?.userId;

		if (!customerId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Find invite
		const invite = await db.jobInvite
			.findById(inviteId)
			.populate("job", "title")
			.populate("contractor", "full_name email");

		if (!invite) {
			return sendError(res, 404, "Invite not found");
		}

		// Verify customer is the sender
		if (invite.customer.toString() !== customerId) {
			return sendError(
				res,
				403,
				"You are not authorized to cancel this invite",
			);
		}

		// Check if invite is still pending
		if (invite.status !== "pending") {
			return sendError(
				res,
				400,
				"Cannot cancel an invite that has already been processed",
			);
		}

		// Update invite status to cancelled
		invite.status = "cancelled";
		await invite.save();

		// Get customer details for notification
		const customer = await db.user.findById(customerId);
		const job = invite.job as any;
		const contractor = invite.contractor as any;

		// Send notification to contractor
		await NotificationService.sendToUser({
			userId: contractor._id.toString(),
			title: "Invite Cancelled",
			body: `${customer?.full_name || "A customer"} has cancelled the invite for "${job.title}"`,
			type: "general",
			data: {
				jobId: job._id.toString(),
				inviteId: inviteId,
				customerId: customerId,
				customerName: customer?.full_name || "",
			},
		});

		return sendSuccess(res, 200, "Invite cancelled successfully", null);
	} catch (error) {
		console.error("Cancel invite error:", error);
		return sendError(res, 500, "Failed to cancel invite");
	}
};
