import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Contractor rejects a job invite
 * PATCH /api/job-invite/:inviteId/reject
 */
export const rejectInvite: RequestHandler = async (req, res) => {
	try {
		const inviteId = req.params.inviteId;
		const contractorId = req.user?.userId;
		const { rejectionReason } = req.body;

		if (!contractorId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Find invite
		const invite = await db.jobInvite
			.findById(inviteId)
			.populate("job", "title")
			.populate("customer", "full_name email");

		if (!invite) {
			return sendError(res, 404, "Invite not found");
		}

		// Verify contractor is the invited one
		if (invite.contractor.toString() !== contractorId) {
			return sendError(res, 403, "You are not authorized to reject this invite");
		}

		// Check if invite is still pending
		if (invite.status !== "pending") {
			return sendError(res, 400, "This invite has already been processed");
		}

		// Update invite status
		invite.status = "rejected";
		if (rejectionReason) {
			invite.rejectionReason = rejectionReason;
		}
		await invite.save();

		// Get contractor details for notification
		const contractor = await db.user.findById(contractorId);
		const job = invite.job as any;

		// Send notification to customer
		await NotificationService.sendToUser({
			userId: invite.customer._id.toString(),
			title: "Invite Rejected",
			body: `${contractor?.full_name || "A contractor"} has declined your invite for "${job.title}"`,
			type: "booking_declined",
			data: {
				jobId: job._id.toString(),
				inviteId: inviteId,
				contractorId: contractorId,
				contractorName: contractor?.full_name || "",
				rejectionReason: rejectionReason || "",
			},
		});

		// Populate invite details for response
		await invite.populate([
			{ path: "job", select: "title description budget location category" },
			{ path: "contractor", select: "full_name email profile_img" },
		]);

		return sendSuccess(res, 200, "Invite rejected successfully", invite);
	} catch (error) {
		console.error("Reject invite error:", error);
		return sendError(res, 500, "Failed to reject invite");
	}
};
