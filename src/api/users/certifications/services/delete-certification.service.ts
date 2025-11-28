import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

export const deleteCertification: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const certification = await db.certification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!certification) {
      return sendError(res, 404, "Certification not found");
    }

    // Remove certification from user's certifications array
    await db.user.findByIdAndUpdate(userId, {
      $pull: { certifications: id },
    });

    return sendSuccess(res, 200, "Certification deleted successfully", null);
  } catch (error) {
    console.error("Delete certification error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
