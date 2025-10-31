import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { UpdateCertification } from "../certifications.validation";

export const updateCertification: RequestHandler<
	{ id: string },
	any,
	UpdateCertification
> = async (req, res) => {
	try {
		const userId = req.user?.userId;
		const { id } = req.params;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const certification = await db.certification.findOneAndUpdate(
			{ _id: id, user: userId },
			{ $set: req.body },
			{ new: true, runValidators: true },
		);

		if (!certification) {
			return sendError(res, 404, "Certification not found");
		}

		return sendSuccess(
			res,
			200,
			"Certification updated successfully",
			certification,
		);
	} catch (error) {
		console.error("Update certification error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
