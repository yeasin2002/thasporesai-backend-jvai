import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { UpdateWorkSample } from "../work_samples.validation";

export const updateWorkSample: RequestHandler<
	{ id: string },
	any,
	UpdateWorkSample
> = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { id } = req.params;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const workSample = await db.workSample.findOneAndUpdate(
			{ _id: id, user: userId },
			{ $set: req.body },
			{ new: true, runValidators: true },
		);

		if (!workSample) {
			return sendError(res, 404, "Work sample not found");
		}

		return sendSuccess(
			res,
			200,
			"Work sample updated successfully",
			workSample,
		);
	} catch (error) {
		console.error("Update work sample error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
