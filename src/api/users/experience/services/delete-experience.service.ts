import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const deleteExperience: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const experience = await db.experience.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!experience) {
      return sendError(res, 404, "Experience not found");
    }

    // Remove experience from user's experience array
    await db.user.findByIdAndUpdate(userId, {
      $pull: { experience: id },
    });

    return sendSuccess(res, 200, "Experience deleted successfully", null);
  } catch (error) {
    console.error("Delete experience error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
