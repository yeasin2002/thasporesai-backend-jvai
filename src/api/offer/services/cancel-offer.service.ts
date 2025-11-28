import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import {
	sendBadRequest,
	sendForbidden,
	sendInternalError,
	sendNotFound,
	sendSuccess,
} from "@/helpers";
import { logger } from "@/lib";
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import type { CancelOffer } from "../offer.validation";

export const cancelOffer: RequestHandler<any, any, CancelOffer> = async (
	req,
	res,
) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const userId = req.user?.id;
		const {
			customer: customerId,
			contractor: contractorId,
			jobId,
			reason,
		} = req.body;

		if (!userId) {
			await session.abortTransaction();
			return sendBadRequest(res, "User ID not found");
		}

		// 1. Validate: Authenticated user must be the customer
		if (customerId !== userId) {
			await session.abortTransaction();
			return sendForbidden(res, "You can only cancel your own offers");
		}

		// 2. Find offer using customer, contractor, and job
		const offer = await db.offer
			.findOne({
				customer: customerId,
				contractor: contractorId,
				job: jobId,
			})
			.session(session);

		if (!offer) {
			await session.abortTransaction();
			return sendNotFound(
				res,
				"Offer not found for the specified customer, contractor, and job",
			);
		}

		// 3. Validate: Only pending offers can be cancelled
		if (offer.status !== "pending") {
			await session.abortTransaction();
			return sendBadRequest(
				res,
				`Cannot cancel offer with status: ${offer.status}. Only pending offers can be cancelled.`,
			);
		}

		// 4. Get customer wallet
		const customerWallet = await db.wallet
			.findOne({ user: userId })
			.session(session);

		if (!customerWallet) {
			await session.abortTransaction();
			return sendNotFound(res, "Customer wallet not found");
		}

		// 5. Validate escrow balance
		if (customerWallet.escrowBalance < offer.totalCharge) {
			await session.abortTransaction();
			return sendBadRequest(
				res,
				`Insufficient escrow balance. Required: $${offer.totalCharge}, Available: $${customerWallet.escrowBalance}`,
			);
		}

		// 6. Get related data for notification
		const customer = await db.user.findById(offer.customer).session(session);
		const contractor = await db.user
			.findById(offer.contractor)
			.session(session);
		const job = await db.job.findById(offer.job).session(session);

		if (!customer || !contractor || !job) {
			await session.abortTransaction();
			return sendNotFound(res, "Related data not found");
		}

		// 7. Process refund: Move money from escrow to available balance
		customerWallet.balance += offer.totalCharge;
		customerWallet.escrowBalance -= offer.totalCharge;
		await customerWallet.save({ session });

		// 8. Update offer status
		offer.status = "cancelled";
		offer.cancelledAt = new Date();
		offer.cancellationReason =
			reason || "Cancelled by customer before contractor response";
		await offer.save({ session });

		// 10. Create refund transaction record
		await db.transaction.create(
			[
				{
					type: "refund",
					amount: offer.totalCharge,
					from: offer.customer,
					to: offer.customer,
					offer: offer._id,
					job: offer.job,
					status: "completed",
					description: `Offer cancelled by customer - Full refund of $${offer.totalCharge}`,
					completedAt: new Date(),
				},
			],
			{ session },
		);

		// 11. Commit transaction
		await session.commitTransaction();

		// 12. Send notification to contractor
		await NotificationService.sendToUser({
			userId: String(contractor._id),
			title: "Offer Cancelled",
			body: `${customer.full_name} has cancelled their offer for "${job.title}"`,
			type: "general",
			data: {
				offerId: String(offer._id),
				jobId: String(job._id),
				amount: offer.amount.toString(),
				reason: offer.cancellationReason || "",
			},
		});

		// 9. Update engaged application/invite status to cancelled
		const engagement = await db.inviteApplication.findById(offer.engaged);
		if (engagement) {
			engagement.status = "engaged";
			await engagement.save({ session });
		}

		// Todo:  note: nothing is getting here:
		console.log("🚀 ~ cancelOffer ~ engagement:", engagement);
		logger.info("🚀 ~ cancelOffer ~ engagement:", engagement);

		// 13. Return success response
		return sendSuccess(res, 200, "Offer cancelled successfully", {
			offer: {
				_id: offer._id,
				status: offer.status,
				cancelledAt: offer.cancelledAt,
				cancellationReason: offer.cancellationReason,
			},
			refund: {
				amount: offer.totalCharge,
				description: "Full refund issued to your wallet",
			},
			wallet: {
				balance: customerWallet.balance,
				escrowBalance: customerWallet.escrowBalance,
			},
			message:
				"Your offer has been cancelled and the full amount has been refunded to your wallet. You can send a new offer if needed.",
		});
	} catch (error) {
		await session.abortTransaction();
		console.error("Error cancelling offer:", error);
		return sendInternalError(res, "Failed to cancel offer", error);
	} finally {
		session.endSession();
	}
};
