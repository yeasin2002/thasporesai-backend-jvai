import { db } from "@/db";
import { exceptionErrorHandler, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

// Get My Jobs (Customer's own jobs)
export const getMyJobs: RequestHandler = async (req, res) => {
	try {
		const customerId = req.user?.userId as string;

		const jobs = await db.job
			.find({ customerId })
			.populate("category", "name icon")
			// .populate("contractorId", "name email")
			.populate("location", "name state coordinates")
			.sort({ createdAt: -1 });

		return sendSuccess(res, 200, "Your jobs retrieved successfully", jobs);
	} catch (error) {
		return exceptionErrorHandler(error, res, "Failed to retrieve your jobs");
	}
};
