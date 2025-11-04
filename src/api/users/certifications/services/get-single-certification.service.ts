import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getSingleCertification: RequestHandler<{ id: string }> = async (
	req,
	res,
) => {
	try {
		const userId = req.user?.userId;
		const { id } = req.params;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const certification = await db.certification.findOne({
			_id: id,
			user: userId,
		});

		if (!certification) {
			return sendError(res, 404, "Certification not found");
		}

		return sendSuccess(
			res,
			200,
			"Certification retrieved successfully",
			certification,
		);
	} catch (error) {
		console.error("Get certification error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
