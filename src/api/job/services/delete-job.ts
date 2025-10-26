import { db } from "@/db";
import type { RequestHandler } from "express";

// Delete Job (Owner or Admin)
export const deleteJob: RequestHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.userId as string;
		const userRole = req.user?.role;

		// Check if job exists
		const job = await db.job.findById(id);
		if (!job) {
			return res.status(404).json({
				status: 404,
				message: "Job not found",
				data: null,
			});
		}

		// Check ownership
		if (job.customerId.toString() !== userId && userRole !== "admin") {
			return res.status(403).json({
				status: 403,
				message: "Forbidden - You can only delete your own jobs",
				data: null,
			});
		}

		await db.job.findByIdAndDelete(id);

		res.status(200).json({
			status: 200,
			message: "Job deleted successfully",
			data: null,
		});
	} catch (error) {
		console.error("Delete job error:", error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};
