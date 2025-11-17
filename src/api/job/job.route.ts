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
	CancelJobSchema,
	CreateJobSchema,
	JobIdSchema,
	SearchJobSchema,
	UpdateJobSchema,
	UpdateJobStatusSchema,
} from "./job.validation";
import {
  cancelJob,
  completeJob,
  createJob,
  deleteJob,
  getAllJobs,
  getEngagedJobs,
  getJobById,
  getMyJobs,
  updateJob,
  updateJobStatus,
} from "./services";

export const job: Router = express.Router();

// Public routes (with optional auth for personalized results)
job.get("/", optionalAuth, validateQuery(SearchJobSchema), getAllJobs);

// Customer routes (authenticated)
// Note: Specific routes must come before parameterized routes
job.get(
  "/my/jobs",
  requireAuth,
  requireRole("customer"),
  validateQuery(SearchJobSchema),
  getMyJobs
);

// Get engaged jobs (jobs with applications or offers)
job.get(
  "/engaged",
  requireAuth,
  requireRole("customer"),
  validateQuery(SearchJobSchema),
  getEngagedJobs
);

job.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateBody(CreateJobSchema),
  createJob
);

// Parameterized routes (must come after specific routes)
job.get("/:id", validateParams(JobIdSchema), getJobById);

// Owner or Admin routes
job.put(
  "/:id",
  requireAuth,
  validateParams(JobIdSchema),
  validateBody(UpdateJobSchema),
  updateJob
);
job.delete("/:id", requireAuth, validateParams(JobIdSchema), deleteJob);

// ============================================
// PAYMENT SYSTEM ROUTES (Phase 5)
// ============================================

// Mark job complete (Customer only)
job.post(
	"/:id/complete",
	requireAuth,
	requireRole("customer"),
	validateParams(JobIdSchema),
	completeJob,
);

// Update job status (Customer or Contractor)
job.patch(
	"/:id/status",
	requireAuth,
	validateParams(JobIdSchema),
	validateBody(UpdateJobStatusSchema),
	updateJobStatus,
);

// Cancel job (Customer or Admin)
job.post(
	"/:id/cancel",
	requireAuth,
	validateParams(JobIdSchema),
	validateBody(CancelJobSchema),
	cancelJob,
);
