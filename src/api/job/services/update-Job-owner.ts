import { db } from "@/db";
import type { RequestHandler } from "express";
import type { UpdateJob } from "../job.validation";

// Update Job (Owner or Admin)
export const updateJob: RequestHandler<
  { id: string },
  unknown,
  UpdateJob
> = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.userId as string;
    const userRole = req.user?.role;

    // Check if job exists
    const job = await db.job.findById(id);
    if (!job) {
      return res.status(404).json({
        status: 404,
        message: "Job not found",
        data: null,
      });
    }

    // Check ownership (customer can only update their own jobs, admin can update any)
    if (job.customerId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        status: 403,
        message: "Forbidden - You can only update your own jobs",
        data: null,
      });
    }

    // If updating categories, validate they exist
    if (updates.category) {
      const categories = await db.category.find({
        _id: { $in: updates.category },
      });
      if (categories.length !== updates.category.length) {
        return res.status(400).json({
          status: 400,
          message: "One or more categories not found",
          data: null,
        });
      }
    }

    // Update job
    const updatedJob = await db.job
      .findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      })
      .populate("category", "name icon")
      .populate("customerId", "name email")
      .populate("contractorId", "name email")
      .populate("location", "name state coordinates");

    res.status(200).json({
      status: 200,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
