import { db } from "@/db";
import {
  exceptionErrorHandler,
  sendSuccess,
  validatePagination,
} from "@/helpers";
import type { RequestHandler } from "express";
import type { SearchJob } from "../job.validation";

// Get My Jobs (Customer's own jobs with search and filters)
export const getMyJobs: RequestHandler<
  unknown,
  unknown,
  unknown,
  SearchJob
> = async (req, res) => {
  try {
    const customerId = req.user?.userId as string;

    const {
      search,
      category,
      status,
      minBudget,
      maxBudget,
      location,
      page,
      limit,
      contractorId,
    } = req.query;

    // Validate and sanitize pagination
    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = validatePagination(page, limit);

    // Build query - always filter by customerId
    const query: any = { customerId };

    // If contractorId is provided, filter out jobs where contractor is already engaged
    if (contractorId && typeof contractorId === "string") {
      // Get jobs where contractor has any engagement (invited or applied)
      const engagedJobIds = await db.inviteApplication
        .find({
          contractor: contractorId,
          customer: customerId,
          status: { $in: ["invited", "requested", "engaged", "offered"] },
        })
        .distinct("job");

      // Exclude jobs where contractor is already engaged
      if (engagedJobIds.length > 0) {
        query._id = { $nin: engagedJobIds };
      }
    }

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
        .populate("customerId", "name email full_name profile_img phone")
        .populate("location", "name state coordinates")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      db.job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, 200, "Your jobs retrieved successfully", {
      jobs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to retrieve your jobs");
  }
};
