import type { UserQuery } from "@/api/admin/user/user.validation";
import { db } from "@/db";
import type { UserDocument } from "@/db/models/user.model";
import { exceptionErrorHandler, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { FilterQuery } from "mongoose";

// Get all users with search and filter
export const getAllUsers: RequestHandler<
  unknown,
  unknown,
  unknown,
  UserQuery
> = async (req, res) => {
  try {
    const { search, role, location } = req.query;

    // Build query filter with proper typing
    const filter: FilterQuery<UserDocument> = {};

    // Search by full name (case-insensitive)
    if (search) {
      filter.full_name = { $regex: search, $options: "i" };
    }

    // Filter by role
    if (role) {
      filter.role = role;
    }

    // Filter by location (user's location array contains the specified location ID)
    if (location) {
      filter.location = location;
    }

    // Fetch users with populated category and location data
    const users = await db.user
      .find(filter)
      .select("-password -refreshTokens -otp")
      .populate("category", "name icon description")
      .populate("location", "name state coordinates")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Users fetched successfully", users);
  } catch (error) {
    return exceptionErrorHandler(error, res, "Failed to fetch users");
  }
};
