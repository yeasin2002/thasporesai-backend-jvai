import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { CreateExperience } from "../experience.validation";

export const createExperience: RequestHandler<
  {},
  any,
  CreateExperience
> = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const experience = await db.experience.create({
      ...req.body,
      user: userId,
    });

    // Add experience to user's experience array
    await db.user.findByIdAndUpdate(userId, {
      $push: { experience: experience._id },
    });

    return sendSuccess(res, 201, "Experience created successfully", experience);
  } catch (error) {
    console.error("Create experience error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
