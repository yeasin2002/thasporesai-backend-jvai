import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getExperiences: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const experiences = await db.experience
      .find({ user: userId })
      .sort({ start_date: -1 });

    return sendSuccess(
      res,
      200,
      "Experiences retrieved successfully",
      experiences
    );
  } catch (error) {
    console.error("Get experiences error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
