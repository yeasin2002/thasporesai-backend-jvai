import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const deleteWorkSample: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const workSample = await db.workSample.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!workSample) {
      return sendError(res, 404, "Work sample not found");
    }

    // Remove work sample from user's work_samples array
    await db.user.findByIdAndUpdate(userId, {
      $pull: { work_samples: id },
    });

    return sendSuccess(res, 200, "Work sample deleted successfully", null);
  } catch (error) {
    console.error("Delete work sample error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
