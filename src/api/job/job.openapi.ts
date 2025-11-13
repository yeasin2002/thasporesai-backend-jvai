import { openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";
import { z } from "zod";
import {
  CreateJobSchema,
  ErrorResponseSchema,
  JobIdSchema,
  JobResponseSchema,
  JobsResponseSchema,
  SearchJobSchema,
  SuccessResponseSchema,
  UpdateJobSchema,
} from "./job.validation";

// Register schemas
registry.register("CreateJob", CreateJobSchema);
registry.register("UpdateJob", UpdateJobSchema);
registry.register("JobIdParam", JobIdSchema);
registry.register("SearchJob", SearchJobSchema);
registry.register("JobResponse", JobResponseSchema);
registry.register("JobsResponse", JobsResponseSchema);
registry.register("SuccessResponse", SuccessResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// GET /api/job - Get all jobs with search and filters
registry.registerPath({
	method: "get",
	path: openAPITags.job.basepath,
	description:
		"Get all jobs with optional search and filters. If authenticated as a contractor, includes 'isApplied' field indicating whether you've applied to each job.",
	summary: "Get all jobs",
	tags: [openAPITags.job.name],
	request: {
		query: SearchJobSchema,
	},
	responses: {
		200: {
			description:
				"Jobs retrieved successfully. Each job includes 'isApplied' field (true/false) for contractors.",
			content: {
				"application/json": {
					schema: JobsResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// GET /api/job/:id - Get job by ID
registry.registerPath({
	method: "get",
	path: `${openAPITags.job.basepath}/{id}`,
	description: "Get a single job by ID",
	summary: "Get job by ID",
	tags: [openAPITags.job.name],
	request: {
		params: JobIdSchema,
	},
	responses: {
		200: {
			description: "Job retrieved successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// GET /api/job/my/jobs - Get customer's own jobs with search and filters
registry.registerPath({
	method: "get",
	path: `${openAPITags.job.basepath}/my/jobs`,
	description:
		"Get all jobs posted by the authenticated customer with optional search and filters",
	summary: "Get my jobs",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchJobSchema,
	},
	responses: {
		200: {
			description: "Jobs retrieved successfully",
			content: {
				"application/json": {
					schema: JobsResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Customer only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// POST /api/job - Create job (Customer only)
registry.registerPath({
	method: "post",
	path: openAPITags.job.basepath,
	description: "Create a new job (Customer only)",
	summary: "Create job",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateJobSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Job created successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error or invalid categories",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Customer only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// PUT /api/job/:id - Update job (Owner or Admin)
registry.registerPath({
	method: "put",
	path: `${openAPITags.job.basepath}/{id}`,
	description: "Update a job (Owner or Admin only)",
	summary: "Update job",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateJobSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Job updated successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error or invalid categories",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Owner or Admin only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// DELETE /api/job/:id - Delete job (Owner or Admin)
registry.registerPath({
	method: "delete",
	path: `${openAPITags.job.basepath}/{id}`,
	description: "Delete a job (Owner or Admin only)",
	summary: "Delete job",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
	},
	responses: {
		200: {
			description: "Job deleted successfully",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Owner or Admin only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// ============================================
// PAYMENT SYSTEM ENDPOINTS (Phase 5)
// ============================================

import { CancelJobSchema, UpdateJobStatusSchema } from "./job.validation";

// Register payment schemas
registry.register("UpdateJobStatus", UpdateJobStatusSchema);
registry.register("CancelJob", CancelJobSchema);

// Response schemas for payment endpoints
const CompleteJobResponseSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.object({
		job: z.object({
			_id: z.string(),
			status: z.string(),
			completedAt: z.string(),
		}),
		payment: z.object({
			serviceFee: z.number(),
			contractorPayout: z.number(),
			adminCommission: z.number(),
		}),
	}),
});

const CancelJobResponseSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.object({
		job: z.object({
			_id: z.string(),
			status: z.string(),
			cancelledAt: z.string(),
			cancellationReason: z.string(),
		}),
		refundAmount: z.number(),
	}),
});

registry.register("CompleteJobResponse", CompleteJobResponseSchema);
registry.register("CancelJobResponse", CancelJobResponseSchema);

// POST /api/job/:id/complete - Mark job complete (Customer only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.job.basepath}/{id}/complete`,
	description:
		"Customer marks job as complete. Service fee (20%) is transferred to admin. Contractor payout (80%) is transferred to contractor. Escrow is released. Job status changes to 'completed'.",
	summary: "Complete job and release payment",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
	},
	responses: {
		200: {
			description:
				"Job completed successfully. Payment released to contractor.",
			content: {
				"application/json": {
					schema: CompleteJobResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Job not in progress or offer not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Customer only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// PATCH /api/job/:id/status - Update job status
registry.registerPath({
	method: "patch",
	path: `${openAPITags.job.basepath}/{id}/status`,
	description:
		"Update job status. Valid transitions: open→assigned/cancelled, assigned→in_progress/cancelled, in_progress→completed/cancelled. Customer or assigned contractor can update.",
	summary: "Update job status",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateJobStatusSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Job status updated successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Invalid status transition",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Not authorized to update this job",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// POST /api/job/:id/cancel - Cancel job
registry.registerPath({
	method: "post",
	path: `${openAPITags.job.basepath}/{id}/cancel`,
	description:
		"Cancel a job with reason. If offer exists, full refund is issued to customer. Cannot cancel completed jobs. Customer or Admin only.",
	summary: "Cancel job",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
		body: {
			content: {
				"application/json": {
					schema: CancelJobSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Job cancelled successfully. Refund issued if applicable.",
			content: {
				"application/json": {
					schema: CancelJobResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Cannot cancel completed job",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Customer or Admin only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
