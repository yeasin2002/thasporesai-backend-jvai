import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { UpdateExperience } from "../experience.validation";

export const updateExperience: RequestHandler<
	{ id: string },
	any,
	UpdateExperience
> = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { id } = req.params;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const experience = await db.experience.findOneAndUpdate(
			{ _id: id, user: userId },
			{ $set: req.body },
			{ new: true, runValidators: true },
		);

		if (!experience) {
			return sendError(res, 404, "Experience not found");
		}

		return sendSuccess(res, 200, "Experience updated successfully", experience);
	} catch (error) {
		console.error("Update experience error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
