import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { Request, RequestHandler, Response } from "express";

// Get all locations with pagination and search
export const getAllLocations: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, page = "1", limit = "10" } = req.query;

    // Convert to numbers
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: Record<string, any> = {};

    // Search by name (case-insensitive)
    if (search && typeof search === "string") {
      query.name = { $regex: search, $options: "i" };
    }

    // Get total count
    const total = await db.location.countDocuments(query);

    // Get locations with pagination
    const locations = await db.location
      .find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, 200, "Locations fetched successfully", {
      locations,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};
