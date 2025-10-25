import { db } from "@/db";
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
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Number.parseInt(page, 10);
    const limitNum = Number.parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

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
      query.location = { $regex: location, $options: "i" };
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

    res.status(200).json({
      status: 200,
      message: "Jobs retrieved successfully",
      data: {
        jobs,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
