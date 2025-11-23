import { calculatePaymentAmounts } from "@/common/payment-config";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { SendOffer } from "../offer.validation";

/**
 * Send offer directly to contractor via job ID (simplified flow)
 * POST /api/offer/application/send/:jobId
 *
 * This is a simplified flow where customer sends offer directly without
 * requiring prior application or invite. Useful for direct negotiations.
 */
export const sendJobOffer: RequestHandler<
	{ jobId: string },
	any,
	SendOffer & { contractorId: string }
> = async (req, res) => {
	try {
		const { jobId } = req.params;
		const customerId = req?.user?.id;
		const { amount, timeline, description, contractorId } = req.body;

		// 1. Validate job
		const job = await db.job.findById(jobId);

		if (!job) {
			return sendBadRequest(res, "Job not found");
		}

		// 2. Verify customer owns the job
		if (job.customerId.toString() !== customerId) {
			return sendBadRequest(res, "Not authorized - you don't own this job");
		}

		// 3. Check job is still open
		if (job.status !== "open") {
			return sendBadRequest(res, "Job is not open for offers");
		}

		// 4. Validate contractor exists and is a contractor
		const contractor = await db.user.findOne({
			_id: contractorId,
			role: "contractor",
		});

		if (!contractor) {
			return sendBadRequest(res, "Contractor not found");
		}

		// 5. Check for existing offer
		const existingOffer = await db.offer.findOne({
			job: jobId,
			status: { $in: ["pending", "accepted"] },
		});

		if (existingOffer) {
			return sendBadRequest(res, "An offer already exists for this job");
		}

		// 6. Calculate payment amounts
		const amounts = calculatePaymentAmounts(amount);

		// 7. Check wallet balance
		let wallet = await db.wallet.findOne({ user: customerId });
		if (!wallet) {
			wallet = await db.wallet.create({
				user: customerId,
				balance: 0,
				escrowBalance: 0,
			});
		}

		if (wallet.balance < amounts.totalCharge) {
			return sendBadRequest(
				res,
				`Insufficient balance. Required: ${amounts.totalCharge}, Available: ${wallet.balance}`,
			);
		}

		// 8. Create offer (no application or invite reference)
		const offer = await db.offer.create({
			job: jobId,
			customer: customerId,
			contractor: contractorId,
			// No application or invite - direct offer
			amount: amounts.jobBudget,
			platformFee: amounts.platformFee,
			serviceFee: amounts.serviceFee,
			contractorPayout: amounts.contractorPayout,
			totalCharge: amounts.totalCharge,
			timeline,
			description,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		});

		// 9. Deduct from wallet and move to escrow
		wallet.balance -= amounts.totalCharge;
		wallet.escrowBalance += amounts.totalCharge;
		wallet.totalSpent += amounts.totalCharge;
		await wallet.save();

		// 10. Create transaction record
		await db.transaction.create({
			type: "escrow_hold",
			amount: amounts.totalCharge,
			from: customerId,
			to: customerId, // Escrow is still customer's money
			offer: offer._id,
			job: jobId,
			status: "completed",
			description: `Escrow hold for direct job offer: ${amounts.totalCharge}`,
			completedAt: new Date(),
		});

		// 11. Send notification to contractor
		await NotificationService.sendToUser({
			userId: contractorId,
			title: "New Job Offer Received",
			body: `You received a direct offer of ${amount} for "${job.title}"`,
			type: "booking_confirmed",
			data: {
				offerId: (offer._id as any).toString(),
				jobId: jobId,
				amount: amount.toString(),
				source: "direct",
			},
		});

		return sendSuccess(res, 201, "Offer sent successfully", {
			offer,
			walletBalance: wallet.balance,
			amounts,
			source: "direct",
		});
	} catch (error) {
		console.error("Error sending direct job offer:", error);
		return sendInternalError(res, "Failed to send offer");
	}
};
