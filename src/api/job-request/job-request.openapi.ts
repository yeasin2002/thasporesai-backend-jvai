import { openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";
import {
  ApplicationIdParamSchema,
  ApplicationResponseSchema,
  ApplicationsResponseSchema,
  ApplyForJobSchema,
  ErrorResponseSchema,
  JobIdParamSchema,
  SearchCustomerApplicationsSchema,
  SearchMyApplicationsSchema,
  SuccessResponseSchema,
} from "./job-request.validation";

// Register schemas
registry.register("ApplyForJob", ApplyForJobSchema);
registry.register("JobIdParam", JobIdParamSchema);
registry.register("ApplicationIdParam", ApplicationIdParamSchema);
registry.register("SearchMyApplications", SearchMyApplicationsSchema);
registry.register(
	"SearchCustomerApplications",
	SearchCustomerApplicationsSchema,
);
registry.register("ApplicationResponse", ApplicationResponseSchema);
registry.register("ApplicationsResponse", ApplicationsResponseSchema);
registry.register("JobRequestSuccessResponse", SuccessResponseSchema);
registry.register("JobRequestErrorResponse", ErrorResponseSchema);

// POST /api/job-request/apply/:jobId - Apply for a job
registry.registerPath({
	method: "post",
	path: `${openAPITags.job_request.basepath}/apply/{jobId}`,
	description: "Contractor applies for a job",
	summary: "Apply for job",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: ApplyForJobSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Application submitted successfully",
			content: {
				"application/json": {
					schema: ApplicationResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad request - already applied or job not accepting applications",
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

// GET /api/job-request/my - Get contractor's applications
registry.registerPath({
	method: "get",
	path: `${openAPITags.job_request.basepath}/my`,
	description:
		"Get contractor's own job applications with optional search and filters. Supports pagination and filtering by job criteria.",
	summary: "Get my applications",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchMyApplicationsSchema,
	},
	responses: {
		200: {
			description:
				"Applications retrieved successfully with pagination information",
			content: {
				"application/json": {
					schema: ApplicationsResponseSchema,
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

// GET /api/job-request/job/:jobId - Get applications for a job
registry.registerPath({
	method: "get",
	path: `${openAPITags.job_request.basepath}/job/{jobId}`,
	description: "Get all applications for a specific job (Customer only)",
	summary: "Get job applications",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdParamSchema,
	},
	responses: {
		200: {
			description: "Applications retrieved successfully",
			content: {
				"application/json": {
					schema: ApplicationsResponseSchema,
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
			description: "Forbidden - not job owner",
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

// PATCH /api/job-request/:applicationId/accept - Accept application
registry.registerPath({
	method: "patch",
	path: `${openAPITags.job_request.basepath}/{applicationId}/accept`,
	description: "Accept a job application (Customer only)",
	summary: "Accept application",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: ApplicationIdParamSchema,
	},
	responses: {
		200: {
			description: "Application accepted successfully",
			content: {
				"application/json": {
					schema: ApplicationResponseSchema,
				},
			},
		},
		400: {
			description: "Application already processed",
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
			description: "Forbidden - not job owner",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Application not found",
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

// PATCH /api/job-request/:applicationId/reject - Reject application
registry.registerPath({
	method: "patch",
	path: `${openAPITags.job_request.basepath}/{applicationId}/reject`,
	description: "Reject a job application (Customer only)",
	summary: "Reject application",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: ApplicationIdParamSchema,
	},
	responses: {
		200: {
			description: "Application rejected successfully",
			content: {
				"application/json": {
					schema: ApplicationResponseSchema,
				},
			},
		},
		400: {
			description: "Application already processed",
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
			description: "Forbidden - not job owner",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Application not found",
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

// DELETE /api/job-request/:applicationId - Cancel application
registry.registerPath({
	method: "delete",
	path: `${openAPITags.job_request.basepath}/{applicationId}`,
	description: "Cancel own job application (Contractor only)",
	summary: "Cancel application",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: ApplicationIdParamSchema,
	},
	responses: {
		200: {
			description: "Application cancelled successfully",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		400: {
			description: "Cannot cancel processed application",
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
			description: "Forbidden - not application owner",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Application not found",
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

// GET /api/job-request/customer/all - Get all applications for customer's jobs
registry.registerPath({
	method: "get",
	path: `${openAPITags.job_request.basepath}/customer/all`,
	description:
		"Get all applications received for customer's jobs with optional filtering by job and status. Supports pagination.",
	summary: "Get all customer applications",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		query: SearchCustomerApplicationsSchema,
	},
	responses: {
		200: {
			description:
				"Applications retrieved successfully with pagination information",
			content: {
				"application/json": {
					schema: ApplicationsResponseSchema,
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
// OFFER ENDPOINTS (Payment System)
// ============================================

import { z } from "zod";
import {
    OfferIdParamSchema,
    RejectOfferSchema,
    SendOfferSchema,
} from "./job-request.validation";

// Register offer schemas
registry.register("SendOffer", SendOfferSchema);
registry.register("OfferIdParam", OfferIdParamSchema);
registry.register("RejectOffer", RejectOfferSchema);

// Offer response schemas
const OfferSchema = z.object({
	_id: z.string(),
	job: z.string(),
	customer: z.string(),
	contractor: z.string(),
	application: z.string(),
	amount: z.number(),
	platformFee: z.number(),
	serviceFee: z.number(),
	contractorPayout: z.number(),
	totalCharge: z.number(),
	timeline: z.string(),
	description: z.string(),
	status: z.enum([
		"pending",
		"accepted",
		"rejected",
		"cancelled",
		"completed",
		"expired",
	]),
	expiresAt: z.string().optional(),
	acceptedAt: z.string().optional(),
	rejectedAt: z.string().optional(),
	rejectionReason: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const SendOfferResponseSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.object({
		offer: OfferSchema,
		walletBalance: z.number(),
		amounts: z.object({
			jobBudget: z.number(),
			platformFee: z.number(),
			serviceFee: z.number(),
			contractorPayout: z.number(),
			totalCharge: z.number(),
			adminTotal: z.number(),
		}),
	}),
});

const AcceptOfferResponseSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.object({
		offer: OfferSchema,
		job: z.object({
			_id: z.string(),
			status: z.string(),
			contractorId: z.string(),
			assignedAt: z.string(),
		}),
		payment: z.object({
			platformFee: z.number(),
			serviceFee: z.number(),
			contractorPayout: z.number(),
		}),
	}),
});

const RejectOfferResponseSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.object({
		offer: OfferSchema,
		refundAmount: z.number(),
	}),
});

registry.register("Offer", OfferSchema);
registry.register("SendOfferResponse", SendOfferResponseSchema);
registry.register("AcceptOfferResponse", AcceptOfferResponseSchema);
registry.register("RejectOfferResponse", RejectOfferResponseSchema);

// POST /api/job-request/:applicationId/send-offer - Send offer (Customer only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.job_request.basepath}/{applicationId}/send-offer`,
	description:
		"Customer sends an offer to a contractor. Money is moved to escrow. Only one offer per job is allowed. Customer pays job amount + 5% platform fee.",
	summary: "Send offer to contractor",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: ApplicationIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: SendOfferSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description:
				"Offer sent successfully. Money moved to escrow. Contractor notified.",
			content: {
				"application/json": {
					schema: SendOfferResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad request - Insufficient balance, job not open, or offer already exists",
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
			description: "Forbidden - not job owner",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Application not found",
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

// POST /api/job-request/offer/:offerId/accept - Accept offer (Contractor only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.job_request.basepath}/offer/{offerId}/accept`,
	description:
		"Contractor accepts an offer. Platform fee (5%) is transferred to admin. Job status changes to 'assigned'. All other applications are rejected.",
	summary: "Accept offer",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: OfferIdParamSchema,
	},
	responses: {
		200: {
			description:
				"Offer accepted successfully. Platform fee transferred. Job assigned.",
			content: {
				"application/json": {
					schema: AcceptOfferResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Offer not found or already processed",
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
			description: "Forbidden - not offer recipient",
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

// POST /api/job-request/offer/:offerId/reject - Reject offer (Contractor only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.job_request.basepath}/offer/{offerId}/reject`,
	description:
		"Contractor rejects an offer with a reason. Full refund (job amount + platform fee) is returned to customer wallet. Application status is reset.",
	summary: "Reject offer",
	tags: [openAPITags.job_request.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: OfferIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: RejectOfferSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description:
				"Offer rejected successfully. Full refund issued to customer.",
			content: {
				"application/json": {
					schema: RejectOfferResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Offer not found or already processed",
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
			description: "Forbidden - not offer recipient",
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
