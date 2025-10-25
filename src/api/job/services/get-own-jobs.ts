import { db } from "@/db";
import type { RequestHandler } from "express";

// Get My Jobs (Customer's own jobs)
export const getMyJobs: RequestHandler = async (req, res) => {
  try {
    const customerId = req.user?.userId as string;

    const jobs = await db.job
      .find({ customerId })
      .populate("category", "name icon")
      .populate("contractorId", "name email")
      .populate("location", "name state coordinates")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      message: "Your jobs retrieved successfully",
      data: jobs,
    });
  } catch (error) {
    console.error("Get my jobs error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
