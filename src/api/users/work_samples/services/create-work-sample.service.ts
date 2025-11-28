import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";
import type { CreateWorkSample } from "../work_samples.validation";

export const createWorkSample: RequestHandler<
  {},
  any,
  CreateWorkSample
> = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const workSample = await db.workSample.create({
      ...req.body,
      user: userId,
    });

    // Add work sample to user's work_samples array
    await db.user.findByIdAndUpdate(userId, {
      $push: { work_samples: workSample._id },
    });

    return sendSuccess(
      res,
      201,
      "Work sample created successfully",
      workSample
    );
  } catch (error) {
    console.error("Create work sample error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
