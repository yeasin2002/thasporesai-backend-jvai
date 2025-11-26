import { openAPITags } from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import { z } from "zod";
import {
	CreateJobSchema,
	ErrorResponseSchema,
	JobIdSchema,
	JobResponseSchema,
	JobsResponseSchema,
	SearchJobSchema,
	SearchOfferSendJobSchema,
	SuccessResponseSchema,
	UpdateJobSchema,
} from "./job.validation";

// Register schemas
registry.register("CreateJob", CreateJobSchema);
registry.register("UpdateJob", UpdateJobSchema);
registry.register("JobIdParam", JobIdSchema);
registry.register("SearchJob", SearchJobSchema);
registry.register("SearchOfferSendJob", SearchOfferSendJobSchema);

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
		"Get all jobs posted by the authenticated customer with optional search and filters. When contractorId is provided, returns only jobs where that contractor has NOT been invited and has NOT applied - useful for finding jobs to invite a specific contractor to.",
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

// GET /api/job/pending-jobs - Get jobs with pending offers
registry.registerPath({
	method: "get",
	path: `${openAPITags.job.basepath}/pending-jobs`,
	description:
		"Get all jobs where the customer has sent offers that are pending contractor response. Shows jobs waiting for contractor to accept or reject. Each job includes offer details (with offerId for cancellation) and contractor information. Excludes jobs in 'in_progress', 'completed', or 'cancelled' status.",
	summary: "Get jobs with pending offers (waiting for contractor response)",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchOfferSendJobSchema,
	},
	responses: {
		200: {
			description:
				"Pending offer jobs retrieved successfully with offer and contractor details",
			content: {
				"application/json": {
					schema: z.object({
						status: z.number(),
						message: z.string(),
						data: z.object({
							jobs: z.array(
								z.object({
									_id: z.string(),
									title: z.string(),
									description: z.string(),
									budget: z.number(),
									status: z.enum(["open"]),
									category: z.any(),
									location: z.any(),
									customerId: z.any(),
									createdAt: z.string(),
									updatedAt: z.string(),
									offer: z.object({
										offerId: z
											.string()
											.describe(
												"Offer ID - use this to cancel via POST /api/offer/:offerId/cancel",
											),
										amount: z.number().describe("Offer amount"),
										timeline: z
											.string()
											.describe("Expected completion timeline"),
										description: z.string().describe("Offer message"),
										status: z
											.literal("pending")
											.describe("Always 'pending' for this endpoint"),
										createdAt: z.string().describe("When offer was sent"),
										expiresAt: z
											.string()
											.describe("When offer expires (7 days from creation)"),
										canCancel: z
											.boolean()
											.describe("Always true - customer can cancel"),
									}),
									contractor: z.object({
										_id: z.string().describe("Contractor user ID"),
										full_name: z.string().describe("Contractor name"),
										email: z.string().describe("Contractor email"),
										profile_img: z.string().describe("Profile image URL"),
										phone: z.string().describe("Contact phone"),
										skills: z.array(z.string()).describe("Contractor skills"),
									}),
								}),
							),
							total: z.number(),
							page: z.number(),
							limit: z.number(),
							totalPages: z.number(),
						}),
					}),
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

// GET /api/job/engaged - Get engaged jobs (jobs with applications but no active offers)
registry.registerPath({
	method: "get",
	path: `${openAPITags.job.basepath}/engaged`,
	description:
		"Get all jobs where the customer has received applications but NO active offers (pending/accepted). These jobs are available for sending new offers. Jobs with rejected or expired offers ARE included. Each job includes detailed engagement statistics, current pending offer details (with offerId for cancellation), and complete offer history. The 'currentOffer.offerId' field enables frontend to implement offer cancellation functionality.",
	summary: "Get engaged jobs with offer details for management",
	tags: [openAPITags.job.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchJobSchema,
	},
	responses: {
		200: {
			description:
				"Engaged jobs retrieved successfully with detailed offer information including offerId for cancellation",
			content: {
				"application/json": {
					schema: z.object({
						status: z.number(),
						message: z.string(),
						data: z.object({
							jobs: z.array(
								z.object({
									_id: z.string(),
									title: z.string(),
									description: z.string(),
									budget: z.number(),
									status: z.enum([
										"open",
										"assigned",
										"in_progress",
										"completed",
										"cancelled",
									]),
									category: z.any(),
									location: z.any(),
									customerId: z.any(),
									contractorId: z.any().optional(),
									createdAt: z.string(),
									updatedAt: z.string(),
									engagement: z.object({
										applications: z.object({
											total: z.number().describe("Total applications received"),
											pending: z.number().describe("Pending applications"),
											accepted: z.number().describe("Accepted applications"),
										}),
										offers: z.object({
											total: z.number().describe("Total offers sent"),
											pending: z.number().describe("Pending offers"),
											accepted: z.number().describe("Accepted offers"),
											rejected: z.number().describe("Rejected offers"),
											expired: z.number().describe("Expired offers"),
										}),
										hasApplications: z
											.boolean()
											.describe("Whether job has received applications"),
										hasOffers: z
											.boolean()
											.describe("Whether job has any offers"),
										canSendOffer: z
											.boolean()
											.describe(
												"Whether new offers can be sent (always true for jobs in this list)",
											),
										currentOffer: z
											.object({
												offerId: z
													.string()
													.describe(
														"Offer ID - use this to cancel the offer via POST /api/offer/:offerId/cancel",
													),
												status: z
													.literal("pending")
													.describe("Always 'pending' for current offers"),
												amount: z.number().describe("Job amount"),
												timeline: z
													.string()
													.describe("Expected completion timeline"),
												createdAt: z.string().describe("When offer was sent"),
												expiresAt: z
													.string()
													.describe(
														"When offer expires (7 days from creation)",
													),
												canCancel: z
													.boolean()
													.describe("Always true for pending offers"),
											})
											.nullable()
											.describe(
												"Current pending offer (null if no pending offer exists)",
											),
										allOffers: z
											.array(
												z.object({
													offerId: z.string().describe("Offer ID"),
													status: z
														.enum([
															"pending",
															"accepted",
															"rejected",
															"cancelled",
															"completed",
															"expired",
														])
														.describe("Offer status"),
													amount: z.number().describe("Job amount"),
													timeline: z
														.string()
														.describe("Expected completion timeline"),
													description: z
														.string()
														.optional()
														.describe("Offer description"),
													createdAt: z.string().describe("Offer creation date"),
													expiresAt: z
														.string()
														.optional()
														.describe("Offer expiration date"),
												}),
											)
											.describe("Complete offer history for this job"),
									}),
								}),
							),
							total: z.number(),
							page: z.number(),
							limit: z.number(),
							totalPages: z.number(),
						}),
					}),
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
