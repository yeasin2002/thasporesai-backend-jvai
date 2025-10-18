import { db } from "@/db";
import type { RequestHandler } from "express";
import type { CreateJob, SearchJob, UpdateJob } from "./job.validation";

// Get All Jobs (with search and filters)
export const getAllJobs: RequestHandler<
  unknown,
  unknown,
  unknown,
  SearchJob
> = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      minBudget,
      maxBudget,
      location,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Number.parseInt(page, 10);
    const limitNum = Number.parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by budget range
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number.parseInt(minBudget, 10);
      if (maxBudget) query.budget.$lte = Number.parseInt(maxBudget, 10);
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Get jobs with pagination
    const [jobs, total] = await Promise.all([
      db.job
        .find(query)
        .populate("category", "name icon")
        .populate("customerId", "name email")
        .populate("contractorId", "name email")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      db.job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      status: 200,
      message: "Jobs retrieved successfully",
      data: {
        jobs,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Get Job by ID
export const getJobById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await db.job
      .findById(id)
      .populate("category", "name icon description")
      .populate("customerId", "name email phone")
      .populate("contractorId", "name email phone");

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

// Create Job (Customer only)
export const createJob: RequestHandler<unknown, unknown, CreateJob> = async (
  req,
  res
) => {
  try {
    const { title, category, description, location, budget, date, coverImg } =
      req.body;

    // Get customer ID from authenticated user
    const customerId = req.user!.userId;

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

// Update Job (Owner or Admin)
export const updateJob: RequestHandler<
  { id: string },
  unknown,
  UpdateJob
> = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

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
      .populate("contractorId", "name email");

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

// Delete Job (Owner or Admin)
export const deleteJob: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Check if job exists
    const job = await db.job.findById(id);
    if (!job) {
      return res.status(404).json({
        status: 404,
        message: "Job not found",
        data: null,
      });
    }

    // Check ownership
    if (job.customerId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        status: 403,
        message: "Forbidden - You can only delete your own jobs",
        data: null,
      });
    }

    await db.job.findByIdAndDelete(id);

    res.status(200).json({
      status: 200,
      message: "Job deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Get My Jobs (Customer's own jobs)
export const getMyJobs: RequestHandler = async (req, res) => {
  try {
    const customerId = req.user!.userId;

    const jobs = await db.job
      .find({ customerId })
      .populate("category", "name icon")
      .populate("contractorId", "name email")
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
