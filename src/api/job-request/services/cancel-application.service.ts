import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Cancel own job application (Contractor only)
 * DELETE /api/job-request/:applicationId
 */
export const cancelApplication: RequestHandler = async (req, res) => {
	try {
		const applicationId = req.params.applicationId;
		const contractorId = req.user?.userId;

		if (!contractorId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Find the application
		const application = await db.inviteApplication.findById(applicationId);

		if (!application) {
			return sendError(res, 404, "Application not found");
		}

		// Verify this is a contractor request
		if (application.sender !== "contractor") {
			return sendError(
				res,
				400,
				"Invalid application - not a contractor request",
			);
		}

		// Check if user is the application owner
		if (application.contractor.toString() !== contractorId) {
			return sendError(res, 403, "You can only cancel your own applications");
		}

		// Check if application is still pending (requested status)
		if (application.status !== "requested") {
			return sendError(
				res,
				400,
				`Cannot cancel application that is already ${application.status}`,
			);
		}

		// Update status to cancelled instead of deleting
		application.status = "cancelled";
		await application.save();

		return sendSuccess(res, 200, "Application cancelled successfully", null);
	} catch (error) {
		console.error("Cancel application error:", error);
		return sendError(res, 500, "Failed to cancel application");
	}
};
