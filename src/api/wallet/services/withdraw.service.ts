import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { Withdraw } from "../wallet.validation";

export const withdraw: RequestHandler<{}, any, Withdraw> = async (req, res) => {
	try {
		const userId = req.user!.id;
		const { amount } = req.body;

		// Only contractors can withdraw
		if (req.user!.role !== "contractor") {
			return sendBadRequest(res, "Only contractors can withdraw funds");
		}

		// Minimum withdrawal amount
		if (amount < 10) {
			return sendBadRequest(res, "Minimum withdrawal amount is $10");
		}

		// Maximum withdrawal amount (for security)
		if (amount > 10000) {
			return sendBadRequest(res, "Maximum withdrawal amount is $10,000");
		}

		// Atomically update wallet with balance check (prevents race conditions)
		const wallet = await db.wallet.findOneAndUpdate(
			{
				user: userId,
				balance: { $gte: amount }, // Atomic check - ensures sufficient balance
				isFrozen: false, // Also check wallet is not frozen
			},
			{
				$inc: {
					balance: -amount,
					totalWithdrawals: amount,
				},
			},
			{ new: true },
		);

		// If wallet update failed, check the reason
		if (!wallet) {
			const existingWallet = await db.wallet.findOne({ user: userId });

			if (!existingWallet) {
				return sendBadRequest(res, "Wallet not found");
			}

			if (existingWallet.isFrozen) {
				return sendBadRequest(res, "Wallet is frozen. Please contact support.");
			}

			return sendBadRequest(
				res,
				`Insufficient balance. Available: $${existingWallet.balance}`,
			);
		}

		// Create transaction
		await db.transaction.create({
			type: "withdrawal",
			amount,
			from: userId,
			to: userId,
			status: "completed",
			description: `Withdrawal of $${amount}`,
			completedAt: new Date(),
		});

		// TODO: Integrate with Stripe Connect for actual payout
		// const transfer = await stripe.transfers.create({
		//   amount: Math.round(amount * 100),
		//   currency: "usd",
		//   destination: wallet.stripeAccountId,
		// });

		return sendSuccess(res, 200, "Withdrawal successful", {
			amount,
			newBalance: wallet.balance,
			estimatedArrival: "2-3 business days",
		});
	} catch (error) {
		console.error("Error processing withdrawal:", error);
		return sendInternalError(res, "Failed to process withdrawal");
	}
};
