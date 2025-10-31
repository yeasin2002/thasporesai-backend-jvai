import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { CreateCertification } from "../certifications.validation";

export const createCertification: RequestHandler<
	{},
	any,
	CreateCertification
> = async (req, res) => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const certification = await db.certification.create({
			...req.body,
			user: userId,
		});

		// Add certification to user's certifications array
		await db.user.findByIdAndUpdate(userId, {
			$push: { certifications: certification._id },
		});

		return sendSuccess(
			res,
			201,
			"Certification created successfully",
			certification,
		);
	} catch (error) {
		console.error("Create certification error:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
