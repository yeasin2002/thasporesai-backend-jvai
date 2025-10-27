import { db } from "@/db";
import { handleMongoError, sendSuccess, validatePagination } from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchJob } from "../job.validation";

// Get All Jobs (with search and filters)
export const getAllJobs: RequestHandler<
	unknown,
	unknown,
	unknown,
	SearchJob
> = async (req, res) => {
	try {
		const {
			search,
			category,
			status,
			minBudget,
			maxBudget,
			location,
			page,
			limit,
		} = req.query;

		// Validate and sanitize pagination
		const {
			page: pageNum,
			limit: limitNum,
			skip,
		} = validatePagination(page, limit);

		// Build query
		const query: any = {};

		// Search in title and description
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		// Filter by category
		if (category) {
			query.category = category;
		}

		// Filter by status
		if (status) {
			query.status = status;
		}

		// Filter by budget range
		if (minBudget || maxBudget) {
			query.budget = {};
			if (minBudget) query.budget.$gte = Number.parseInt(minBudget, 10);
			if (maxBudget) query.budget.$lte = Number.parseInt(maxBudget, 10);
		}

		// Filter by location
		if (location) {
			query.location = location;
		}

		// Get jobs with pagination
		const [jobs, total] = await Promise.all([
			db.job
				.find(query)
				.populate("category", "name icon")
				.populate("customerId", "name email")
				.populate("location", "name state coordinates")
				.skip(skip)
				.limit(limitNum)
				.sort({ createdAt: -1 }),
			db.job.countDocuments(query),
		]);

		const totalPages = Math.ceil(total / limitNum);

		return sendSuccess(res, 200, "Jobs retrieved successfully", {
			jobs,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages,
		});
	} catch (error) {
		return handleMongoError(error, res, "Failed to retrieve jobs");
	}
};
