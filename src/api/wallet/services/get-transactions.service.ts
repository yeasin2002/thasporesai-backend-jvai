import { db } from "@/db";
import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getTransactions: RequestHandler = async (req, res) => {
	try {
		const userId = req?.user?.id;
		const { type, page = "1", limit = "10" } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const skip = (pageNum - 1) * limitNum;

		// Build query
		const query: any = {
			$or: [{ from: userId }, { to: userId }],
		};

		if (type) {
			query.type = type;
		}

		// Get transactions
		const transactions = await db.transaction
			.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum)
			.populate("from", "full_name email")
			.populate("to", "full_name email");

		const total = await db.transaction.countDocuments(query);

		return sendSuccess(res, 200, "Transactions retrieved successfully", {
			transactions,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error("Error getting transactions:", error);
		return sendInternalError(res, "Failed to get transactions", error);
	}
};
