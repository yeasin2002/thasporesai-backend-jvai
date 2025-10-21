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
	createJob,
	deleteJob,
	getAllJobs,
	getJobById,
	getMyJobs,
	updateJob,
} from "./job.service";
import {
	CreateJobSchema,
	JobIdSchema,
	SearchJobSchema,
	UpdateJobSchema,
} from "./job.validation";

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
	createJob,
);

// Owner or Admin routes
job.put(
	"/:id",
	requireAuth,
	validateParams(JobIdSchema),
	validateBody(UpdateJobSchema),
	updateJob,
);
job.delete("/:id", requireAuth, validateParams(JobIdSchema), deleteJob);
