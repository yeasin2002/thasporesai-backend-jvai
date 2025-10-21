import { db } from "@/db";
import type { RequestHandler } from "express";

export const getallUser: RequestHandler = async (req, res) => {
  try {
    const { search, role } = req.query as { search?: string; role?: string };

    // Build query filter
    const filter: any = {};

    // Search by full name (case-insensitive)
    if (search) {
      filter.full_name = { $regex: search, $options: "i" };
    }

    // Filter by role
    if (role) {
      filter.role = role;
    }

    // Fetch users with populated category data
    const users = await db.user
      .find(filter)
      .select("-password -refreshTokens -otp")
      .populate("category", "message icon description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
