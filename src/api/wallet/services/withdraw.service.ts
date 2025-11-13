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

		// Get wallet
		const wallet = await db.wallet.findOne({ user: userId });
		if (!wallet) {
			return sendBadRequest(res, "Wallet not found");
		}

		// Check if wallet is frozen
		if (wallet.isFrozen) {
			return sendBadRequest(res, "Wallet is frozen. Please contact support.");
		}

		// Check balance
		if (wallet.balance < amount) {
			return sendBadRequest(
				res,
				`Insufficient balance. Available: $${wallet.balance}`,
			);
		}

		// Minimum withdrawal amount
		if (amount < 10) {
			return sendBadRequest(res, "Minimum withdrawal amount is $10");
		}

		// Maximum withdrawal amount (for security)
		if (amount > 10000) {
			return sendBadRequest(res, "Maximum withdrawal amount is $10,000");
		}

		// Update wallet
		wallet.balance -= amount;
		wallet.totalWithdrawals += amount;
		await wallet.save();

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
