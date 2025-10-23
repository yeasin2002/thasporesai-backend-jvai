import { db } from "@/db";
import type { RequestHandler } from "express";
import type { CreateJob } from "../job.validation";

// Create Job (Customer only)
export const createJob: RequestHandler<unknown, unknown, CreateJob> = async (
  req,
  res
) => {
  try {
    const { title, category, description, location, budget, date, coverImg } =
      req.body;

    // Get customer ID from authenticated user
    const customerId = req.user?.userId as string;

    // Validate categories exist
    const categories = await db.category.find({ _id: { $in: category } });
    if (categories.length !== category.length) {
      return res.status(400).json({
        status: 400,
        message: "One or more categories not found",
        data: null,
      });
    }

    // Create job
    const job = await db.job.create({
      title,
      category,
      description,
      location,
      budget,
      date,
      coverImg,
      customerId,
      status: "open",
    });

    // Populate and return
    const populatedJob = await db.job
      .findById(job._id)
      .populate("category", "name icon")
      .populate("customerId", "name email");

    res.status(201).json({
      status: 201,
      message: "Job created successfully",
      data: populatedJob,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
