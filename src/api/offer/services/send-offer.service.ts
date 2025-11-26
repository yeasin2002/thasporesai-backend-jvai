import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import type { SendOffer } from "../offer.validation";

/**
 * Send offer to contractor based on job application
 * POST /api/offer/application/:applicationId/send
 */
export const sendOffer: RequestHandler<
	{ applicationId: string },
	any,
	SendOffer
> = async (req, res) => {
	try {
		const { applicationId } = req.params;
		const customerId = req?.user?.id;
		const { amount, timeline, description } = req.body;

		// 1. Validate application
		const application = await db.inviteApplication
			.findById(applicationId)
			.populate("job")
			.populate("contractor", "full_name email");

		if (!application) {
			return sendBadRequest(res, "Application not found");
		}

		// Verify this is a contractor request (not a customer invite)
		if (application.sender !== "contractor") {
			return sendBadRequest(
				res,
				"Invalid application - not a contractor request",
			);
		}

		const job = application.job as any;

		// 2. Verify customer owns the job
		if (job.customerId.toString() !== customerId) {
			return sendBadRequest(res, "Not authorized");
		}

		// 3. Check job is still open
		if (job.status !== "open") {
			return sendBadRequest(res, "Job is not open for offers");
		}

		// 4. Check for existing offer
		const existingOffer = await db.offer.findOne({
			job: job._id,
			status: { $in: ["pending", "accepted"] },
		});

		if (existingOffer) {
			return sendBadRequest(res, "An offer already exists for this job");
		}

		// 5. Calculate payment amounts
		const amounts = calculatePaymentAmounts(amount);

		// 6. Get or create wallet (without balance check yet)
		let wallet = await db.wallet.findOne({ user: customerId });
		if (!wallet) {
			wallet = await db.wallet.create({
				user: customerId,
				balance: 0,
				escrowBalance: 0,
			});
		}

		// 7-10. Execute all database operations atomically with optimistic locking
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Atomically deduct from wallet with balance check (prevents race conditions)
			const updatedWallet = await db.wallet.findOneAndUpdate(
				{
					user: customerId,
					balance: { $gte: amounts.totalCharge }, // Atomic check - ensures sufficient balance
				},
				{
					$inc: {
						balance: -amounts.totalCharge,
						escrowBalance: amounts.totalCharge,
						totalSpent: amounts.totalCharge,
					},
				},
				{ new: true, session },
			);

			// If wallet update failed, balance was insufficient
			if (!updatedWallet) {
				await session.abortTransaction();
				return sendBadRequest(
					res,
					`Insufficient balance. Required: ${amounts.totalCharge}, Available: ${wallet.balance}`,
				);
			}

			// Create offer
			const [offer] = await db.offer.create(
				[
					{
						job: job._id,
						customer: customerId,
						contractor: application.contractor._id,
						engaged: applicationId, // Link to unified application model
						amount: amounts.jobBudget,
						platformFee: amounts.platformFee,
						serviceFee: amounts.serviceFee,
						contractorPayout: amounts.contractorPayout,
						totalCharge: amounts.totalCharge,
						timeline,
						description,
						status: "pending",
						expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
					},
				],
				{ session },
			);

			// Create transaction record
			await db.transaction.create(
				[
					{
						type: "escrow_hold",
						amount: amounts.totalCharge,
						from: customerId,
						to: customerId, // Escrow is still customer's money
						offer: offer._id,
						job: job._id,
						status: "completed",
						description: `Escrow hold for job offer: ${amounts.totalCharge}`,
						completedAt: new Date(),
					},
				],
				{ session },
			);

			// Update application status to offered
			application.status = "offered";
			application.offerId = offer._id as any;
			await application.save({ session });

			// Commit transaction
			await session.commitTransaction();

			// 11. Send notification to contractor (outside transaction)
			await NotificationService.sendToUser({
				userId: (application.contractor as any)._id.toString(),
				title: "New Offer Received",
				body: `You received an offer of ${amount} for "${job.title}"`,
				type: "sent_offer",
				data: {
					offerId: (offer._id as any).toString(),
					jobId: job._id.toString(),
					amount: amount.toString(),
					source: "application",
				},
			});

			return sendSuccess(res, 201, "Offer sent successfully", {
				offer,
				walletBalance: updatedWallet.balance,
				amounts,
				source: "application",
			});
		} catch (error) {
			// Rollback transaction on error
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	} catch (error) {
		logger.error("Error sending offer", error);
		return sendInternalError(res, "Failed to send offer");
	}
};
