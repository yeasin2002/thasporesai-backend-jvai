import { db } from "@/db";
import { sendError, sendSuccess, sendUnauthorized } from "@/helpers";
import type { RequestHandler } from "express";

// Get Current User (Me) Handler
export const me: RequestHandler = async (req, res) => {
  try {
    // This will be populated by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) return sendUnauthorized(res);

    const user = await db.user
      .findById(userId)
      .select("-password -refreshTokens -otp");

    if (!user) return sendError(res, 404, "User not found");

    return sendSuccess(res, 200, "User retrieved successfully", user);
  } catch (error) {
    console.error("Get user error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
