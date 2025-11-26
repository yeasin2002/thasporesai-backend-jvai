import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Reject a job application (Customer only)
 * PATCH /api/job-request/:applicationId/reject
 */
export const rejectApplication: RequestHandler = async (req, res) => {
	try {
		const applicationId = req.params.applicationId;
		const userId = req.user?.userId;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Find the application
		const application = await db.inviteApplication
			.findById(applicationId)
			.populate("job");

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

		// Check if user is the job owner
		const job = application.job as any;
		if (job.customerId.toString() !== userId) {
			return sendError(
				res,
				403,
				"You can only reject applications for your own jobs",
			);
		}

		// Check if application is still pending (requested status)
		if (application.status !== "requested") {
			return sendError(
				res,
				400,
				`Application is already ${application.status}`,
			);
		}

		// Update application status to cancelled (rejected)
		application.status = "cancelled";
		await application.save();

		await application.populate("contractor", "full_name email profile_img");

		// Send notification to contractor
		// await NotificationService.sendToUser({
		// 	userId: application.contractor.toString(),
		// 	title: "Application Update",
		// 	body: `Your application for "${job.title}" was not selected this time`,
		// 	type: "booking_declined",
		// 	data: {
		// 		jobId: job._id.toString(),
		// 		applicationId: applicationId,
		// 		jobTitle: job.title,
		// 	},
		// });

		return sendSuccess(
			res,
			200,
			"Application rejected successfully",
			application,
		);
	} catch (error) {
		console.error("Reject application error:", error);
		return sendError(res, 500, "Failed to reject application");
	}
};
