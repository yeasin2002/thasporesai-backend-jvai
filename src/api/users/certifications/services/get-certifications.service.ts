import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getCertifications: RequestHandler = async (req, res) => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const certifications = await db.certification
			.find({ user: userId })
			.sort({ createdAt: -1 });

		return sendSuccess(
			res,
			200,
			"Certifications retrieved successfully",
			certifications,
		);
	} catch (error) {
		console.error("Get certifications error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
