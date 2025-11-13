import { db } from "@/db";
import { sendBadRequest, sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { Deposit } from "../wallet.validation";

export const deposit: RequestHandler<{}, any, Deposit> = async (req, res) => {
	try {
		const userId = req.user!.id;
		const { amount, paymentMethodId } = req.body;

		// Validate amount
		if (amount < 10) {
			return sendBadRequest(res, "Minimum deposit amount is $10");
		}

		// TODO: Process payment with Stripe
		// For now, just add to wallet

		// Get or create wallet
		let wallet = await db.wallet.findOne({ user: userId });
		if (!wallet) {
			wallet = await db.wallet.create({
				user: userId,
				balance: 0,
				escrowBalance: 0,
			});
		}

		// Update wallet
		wallet.balance += amount;
		await wallet.save();

		// Create transaction record
		await db.transaction.create({
			type: "deposit",
			amount,
			from: userId,
			to: userId,
			status: "completed",
			description: `Wallet deposit of $${amount}`,
			completedAt: new Date(),
		});

		return sendSuccess(res, 200, "Deposit successful", {
			wallet,
			transaction: { amount, type: "deposit" },
		});
	} catch (error) {
		console.error("Error depositing:", error);
		return sendInternalError(res, "Failed to deposit");
	}
};
