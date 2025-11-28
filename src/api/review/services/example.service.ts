import { sendInternalError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

// TODO: Implement your service handler
// Example: Get all review
export const getAllReview: RequestHandler = async (_req, res) => {
	try {
		// Add your business logic here
		return sendSuccess(res, 200, "Success", null);
	} catch (error) {
		console.log(error);
		return sendInternalError(res, "Internal Server Error", error);
	}
};
