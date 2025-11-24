import { AdminService } from "@/common/service/admin.service";
import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import mongoose from "mongoose";

export const acceptOffer: RequestHandler = async (req, res) => {
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

		// 2-9. Execute all database operations atomically
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Get admin wallet and user ID
			const adminWallet = await AdminService.getAdminWallet();
			const adminUserId = await AdminService.getAdminUserId();

			// Update offer status
			offer.status = "accepted";
			offer.acceptedAt = new Date();
			await offer.save({ session });

			// Update job
			job.status = "assigned";
			job.contractorId = contractorId;
			job.offerId = offerId;
			job.assignedAt = new Date();
			await job.save({ session });

			// Update application or invite status (if applicable)
			if (offer.application) {
				// Offer was based on application
				await db.jobApplicationRequest.findByIdAndUpdate(
					offer.application,
					{ status: "accepted" },
					{ session },
				);

				// Reject other applications
				await db.jobApplicationRequest.updateMany(
					{
						job: job._id,
						_id: { $ne: offer.application },
						status: "pending",
					},
					{ status: "rejected" },
					{ session },
				);
			} else if (offer.invite) {
				// Offer was based on invite - reject any pending applications
				await db.jobApplicationRequest.updateMany(
					{
						job: job._id,
						status: "pending",
					},
					{ status: "rejected" },
					{ session },
				);
			} else {
				// Direct offer - reject any pending applications
				await db.jobApplicationRequest.updateMany(
					{
						job: job._id,
						status: "pending",
					},
					{ status: "rejected" },
					{ session },
				);
			}

			// Transfer platform fee to admin
			adminWallet.balance += offer.platformFee;
			adminWallet.totalEarnings += offer.platformFee;
			await adminWallet.save({ session });

			// Update customer escrow
			await db.wallet.findOneAndUpdate(
				{ user: offer.customer },
				{
					$inc: {
						escrowBalance: -offer.platformFee,
					},
				},
				{ session },
			);

			// Create transaction for platform fee
			await db.transaction.create(
				[
					{
						type: "platform_fee",
						amount: offer.platformFee,
						from: offer.customer,
						to: adminUserId,
						offer: offerId,
						job: job._id,
						status: "completed",
						description: `Platform fee (5%) for accepted offer`,
						completedAt: new Date(),
					},
				],
				{ session },
			);

			// Commit transaction
			await session.commitTransaction();

			// 10. Send notifications (outside transaction)
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
			// Rollback transaction on error
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	} catch (error) {
		console.error("Error accepting offer:", error);
		return sendInternalError(res, "Failed to accept offer");
	}
};
