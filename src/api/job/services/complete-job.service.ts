import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const completeJob: RequestHandler = async (req, res) => {
	try {
		const { id: jobId } = req.params;
		const customerId = req.user!.id;

		// 1. Validate job
		const job = await db.job.findOne({
			_id: jobId,
			customerId,
			status: "in_progress",
		});

		if (!job) {
			return sendBadRequest(res, "Job not found or not in progress");
		}

		// 2. Get offer
		const offer = await db.offer.findOne({
			job: jobId,
			status: "accepted",
		});

		if (!offer) {
			return sendBadRequest(res, "Offer not found");
		}

		// 3. Update job status
		job.status = "completed";
		job.completedAt = new Date();
		await job.save();

		// 4. Update offer status
		offer.status = "completed";
		offer.completedAt = new Date();
		await offer.save();

		// 5. Get or create admin wallet
		const adminUserId = process.env.ADMIN_USER_ID || "admin";
		let adminWallet = await db.wallet.findOne({ user: adminUserId });
		if (!adminWallet) {
			adminWallet = await db.wallet.create({
				user: adminUserId,
				balance: 0,
				escrowBalance: 0,
			});
		}

		// 6. Transfer service fee to admin
		adminWallet.balance += offer.serviceFee;
		adminWallet.totalEarnings += offer.serviceFee;
		await adminWallet.save();

		// 7. Get or create contractor wallet
		if (!job.contractorId) {
			return sendBadRequest(res, "No contractor assigned to this job");
		}

		let contractorWallet = await db.wallet.findOne({
			user: job.contractorId,
		});
		if (!contractorWallet) {
			contractorWallet = await db.wallet.create({
				user: job.contractorId,
				balance: 0,
				escrowBalance: 0,
			});
		}

		// 8. Transfer contractor payout
		contractorWallet.balance += offer.contractorPayout;
		contractorWallet.totalEarnings += offer.contractorPayout;
		await contractorWallet.save();

		// 9. Release from customer escrow
		await db.wallet.findOneAndUpdate(
			{ user: customerId },
			{
				$inc: {
					escrowBalance: -(offer.serviceFee + offer.contractorPayout),
				},
			},
		);

		// 10. Create transaction records
		await db.transaction.create({
			type: "service_fee",
			amount: offer.serviceFee,
			from: customerId,
			to: adminUserId,
			offer: offer._id,
			job: jobId,
			status: "completed",
			description: `Service fee (20%) for completed job`,
			completedAt: new Date(),
		});

		await db.transaction.create({
			type: "contractor_payout",
			amount: offer.contractorPayout,
			from: customerId,
			to: job.contractorId,
			offer: offer._id,
			job: jobId,
			status: "completed",
			description: `Payment for completed job: ${offer.contractorPayout}`,
			completedAt: new Date(),
		});

		// 11. Send notification to contractor
		await NotificationService.sendToUser({
			userId: job.contractorId.toString(),
			title: "Payment Released",
			body: `You received $${offer.contractorPayout} for completing the job`,
			type: "payment_received",
			data: {
				jobId: jobId.toString(),
				amount: offer.contractorPayout.toString(),
			},
		});

		return sendSuccess(res, 200, "Job marked as complete", {
			job,
			payment: {
				serviceFee: offer.serviceFee,
				contractorPayout: offer.contractorPayout,
				adminCommission: offer.platformFee + offer.serviceFee,
			},
		});
	} catch (error) {
		console.error("Error completing job:", error);
		return sendInternalError(res, "Failed to complete job");
	}
};
