import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getSingleExperience: RequestHandler<{ id: string }> = async (
	req,
	res,
) => {
	try {
		const userId = req.user?.userId;
		const { id } = req.params;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const experience = await db.experience.findOne({
			_id: id,
			user: userId,
		});

		if (!experience) {
			return sendError(res, 404, "Experience not found");
		}

		return sendSuccess(
			res,
			200,
			"Experience retrieved successfully",
			experience,
		);
	} catch (error) {
		console.error("Get experience error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
