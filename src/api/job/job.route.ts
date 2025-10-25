import "./job.openapi";

import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "@/middleware/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
  CreateJobSchema,
  JobIdSchema,
  SearchJobSchema,
  UpdateJobSchema,
} from "./job.validation";
import {
  createJob,
  deleteJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
} from "./services";
import {
  RequestForJobByContractor,
  acceptApplication,
  cancelApplication,
  getJobApplications,
  getMyApplications,
  rejectApplication,
} from "./services/Job-application-request";

export const job: Router = express.Router();

// Public routes (with optional auth for personalized results)
job.get("/", optionalAuth, validateQuery(SearchJobSchema), getAllJobs);
job.get("/:id", validateParams(JobIdSchema), getJobById);

// Customer routes (authenticated)
job.get("/my/jobs", requireAuth, requireRole("customer"), getMyJobs);
job.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateBody(CreateJobSchema),
  createJob
);

// Customer routes for managing applications
// Get all applications for a specific job
job.get(
  "/:id/applications",
  requireAuth,
  requireRole("customer"),
  validateParams(JobIdSchema),
  getJobApplications
);

// Accept an application
job.patch(
  "/applications/:applicationId/accept",
  requireAuth,
  requireRole("customer"),
  acceptApplication
);

// Reject an application
job.patch(
  "/applications/:applicationId/reject",
  requireAuth,
  requireRole("customer"),
  rejectApplication
);

// Contractor routes (authenticated)
// Apply for a job
job.post(
  "/apply/:id",
  requireAuth,
  requireRole("contractor"),
  validateParams(JobIdSchema),
  RequestForJobByContractor
);

// Get contractor's own applications
job.get(
  "/my/applications",
  requireAuth,
  requireRole("contractor"),
  getMyApplications
);

// Cancel own application
job.delete(
  "/applications/:applicationId",
  requireAuth,
  requireRole("contractor"),
  cancelApplication
);

// Owner or Admin routes
job.put(
  "/:id",
  requireAuth,
  validateParams(JobIdSchema),
  validateBody(UpdateJobSchema),
  updateJob
);
job.delete("/:id", requireAuth, validateParams(JobIdSchema), deleteJob);
