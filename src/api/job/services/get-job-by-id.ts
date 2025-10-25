import { db } from "@/db";
import type { RequestHandler } from "express";

// Get Job by ID
export const getJobById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await db.job
      .findById(id)
      .populate("category", "name icon description")
      .populate("customerId", "name email phone")
      .populate("location", "name state coordinates");

    if (!job) {
      return res.status(404).json({
        status: 404,
        message: "Job not found",
        data: null,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Job retrieved successfully",
      data: job,
    });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
