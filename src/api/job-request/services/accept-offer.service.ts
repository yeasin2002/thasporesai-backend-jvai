import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const acceptOfferService: RequestHandler = async (req, res) => {
	try {
		const { offerId } = req.params;
		const contractorId = req.user!.id;

		// 1. Validate offer
		const offer = await db.offer
			.findOne({
				_id: offerId,
				contractor: contractorId,
				status: "pending",
			})
			.populate("job")
			.populate("customer", "full_name email");

		if (!offer) {
			return sendBadRequest(res, "Offer not found or already processed");
		}

		const job = offer.job as any;

		// 2. Update offer status
		offer.status = "accepted";
		offer.acceptedAt = new Date();
		await offer.save();

		// 3. Update job
		job.status = "assigned";
		job.contractorId = contractorId;
		job.offerId = offerId;
		job.assignedAt = new Date();
		await job.save();

		// 4. Update application
		await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
			status: "accepted",
		});

		// 5. Reject other applications
		await db.jobApplicationRequest.updateMany(
			{
				job: job._id,
				_id: { $ne: offer.application },
				status: "pending",
			},
			{
				status: "rejected",
			},
		);

		// 6. Get admin wallet
		const adminWallet = await AdminService.getAdminWallet();
		const adminUserId = await AdminService.getAdminUserId();

		// 7. Transfer platform fee to admin
		adminWallet.balance += offer.platformFee;
		adminWallet.totalEarnings += offer.platformFee;
		await adminWallet.save();

		// 8. Update customer escrow
		await db.wallet.findOneAndUpdate(
			{ user: offer.customer },
			{
				$inc: {
					escrowBalance: -offer.platformFee,
				},
			},
		);

		// 9. Create transaction for platform fee
		await db.transaction.create({
			type: "platform_fee",
			amount: offer.platformFee,
			from: offer.customer,
			to: adminUserId,
			offer: offerId,
			job: job._id,
			status: "completed",
			description: `Platform fee (5%) for accepted offer`,
			completedAt: new Date(),
		});

		// 10. Send notifications
		await NotificationService.sendToUser({
			userId: offer.customer._id.toString(),
			title: "Offer Accepted",
			body: `Your offer has been accepted by the contractor`,
			type: "booking_confirmed",
			data: {
				offerId: offerId.toString(),
				jobId: job._id.toString(),
			},
		});

		// Notify rejected applicants
		const rejectedApplications = await db.jobApplicationRequest
			.find({
				job: job._id,
				status: "rejected",
			})
			.populate("contractor", "_id");

		for (const app of rejectedApplications) {
			await NotificationService.sendToUser({
				userId: (app.contractor as any)._id.toString(),
				title: "Job Filled",
				body: `The job "${job.title}" has been filled`,
				type: "general",
			});
		}

		return sendSuccess(res, 200, "Offer accepted successfully", {
			offer,
			job,
			payment: {
				platformFee: offer.platformFee,
				serviceFee: offer.serviceFee,
				contractorPayout: offer.contractorPayout,
			},
		});
	} catch (error) {
		console.error("Error accepting offer:", error);
		return sendInternalError(res, "Failed to accept offer");
	}
};
