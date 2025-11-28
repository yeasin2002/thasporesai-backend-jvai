import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const getSingleWorkSample: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const workSample = await db.workSample.findOne({
      _id: id,
      user: userId,
    });

    if (!workSample) {
      return sendError(res, 404, "Work sample not found");
    }

    return sendSuccess(
      res,
      200,
      "Work sample retrieved successfully",
      workSample
    );
  } catch (error) {
    console.error("Get work sample error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
