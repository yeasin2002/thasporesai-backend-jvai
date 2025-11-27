import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Customer sends a job invite to a contractor
 * POST /api/job-invite/send/:jobId
 */
export const sendInvite: RequestHandler = async (req, res) => {
	try {
		const jobId = req.params.jobId;
		const customerId = req.user?.userId;
		const { contractorId } = req.body;

		if (!customerId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Check if job exists
		const job = await db.job.findById(jobId);
		if (!job) {
			return sendError(res, 404, "Job not found");
		}

		// Verify customer owns the job
		if (job.customerId.toString() !== customerId) {
			return sendError(
				res,
				403,
				"You can only invite contractors to your own jobs",
			);
		}

		// Check if job is still open
		if (job.status !== "open") {
			return sendError(res, 400, "This job is no longer accepting invites");
		}

		// Check if contractor exists and has contractor role
		const contractor = await db.user.findById(contractorId);
		if (!contractor) {
			return sendError(res, 404, "Contractor not found");
		}

		if (contractor.role !== "contractor") {
			return sendError(res, 400, "User is not a contractor");
		}

		// Check if contractor is suspended
		if (contractor.isSuspend) {
			return sendError(res, 400, "This contractor account is suspended");
		}

		// Check if already invited or has existing application
		const existingApplication = await db.inviteApplication.findOne({
			job: jobId,
			contractor: contractorId,
		});

		if (existingApplication) {
			// If contractor already requested, update to engaged status
			if (existingApplication.status === "requested") {
				existingApplication.status = "engaged";
				existingApplication.sender = "customer"; // Customer is now engaging
				await existingApplication.save();

				await existingApplication.populate([
					{ path: "job", select: "title description budget location category" },
					{ path: "contractor", select: "full_name email profile_img" },
				]);

				return sendSuccess(
					res,
					200,
					"Contractor engaged successfully",
					existingApplication,
				);
			}

			// If already invited or engaged, return error
			if (
				existingApplication.status === "invited" ||
				existingApplication.status === "engaged"
			) {
				return sendError(res, 400, "You have already invited this contractor");
			}
		}

		// Create new invite
		const invite = await db.inviteApplication.create({
			job: jobId,
			customer: customerId,
			contractor: contractorId,
			status: "invited",
			sender: "customer",
		});

		// Populate job and contractor details
		await invite.populate([
			{ path: "job", select: "title description budget location category" },
			{ path: "contractor", select: "full_name email profile_img" },
		]);

		// Get customer details for notification
		// const customer = await db.user.findById(customerId);

		// Send notification to contractor
		// await NotificationService.sendToUser({
		//   userId: contractorId,
		//   title: "New Job Invite",
		//   body: `${
		//     customer?.full_name || "A customer"
		//   } has invited you to work on "${job.title}"`,
		//   type: "job_invite",
		//   data: {
		//     jobId: jobId,
		//     inviteId: String(invite._id),
		//     customerId: customerId,
		//     customerName: customer?.full_name || "",
		//   },
		// });

		return sendSuccess(res, 201, "Invite sent successfully", invite);
	} catch (error) {
		console.error("Send invite error:", error);
		return sendError(res, 500, "Failed to send invite");
	}
};
