import { mediaTypeFormat, openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";
import { z } from "zod";
import {
	ApplicationIdParamSchema,
	ErrorResponseSchema,
	InviteIdParamSchema,
	OfferIdParamSchema,
	RejectOfferSchema,
	SendOfferSchema,
} from "./offer.validation";

// Register offer schemas
registry.register("SendOffer", SendOfferSchema);
registry.register("ApplicationIdParam", ApplicationIdParamSchema);
registry.register("InviteIdParam", InviteIdParamSchema);
registry.register("OfferIdParam", OfferIdParamSchema);
registry.register("RejectOffer", RejectOfferSchema);
registry.register("OfferErrorResponse", ErrorResponseSchema);

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

// POST /api/offer/application/:applicationId/send - Send offer based on application (Customer only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.offer.basepath}/application/{applicationId}/send`,
	description:
		"Customer sends an offer to a contractor based on their job application. Money is moved to escrow. Only one offer per job is allowed. Customer pays job amount + 5% platform fee.",
	summary: "Send offer to contractor (from application)",
	tags: [openAPITags.offer.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: ApplicationIdParamSchema,
		body: {
			content: {
				[mediaTypeFormat.json]: {
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
				[mediaTypeFormat.json]: {
					schema: SendOfferResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad request - Insufficient balance, job not open, or offer already exists",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not job owner",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Application not found",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// POST /api/offer/invite/:inviteId/send - Send offer based on invite (Customer only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.offer.basepath}/invite/{inviteId}/send`,
	description:
		"Customer sends an offer to a contractor based on an accepted job invite. Money is moved to escrow. Only one offer per job is allowed. Customer pays job amount + 5% platform fee. Invite must be in 'accepted' status.",
	summary: "Send offer to contractor (from invite)",
	tags: [openAPITags.offer.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: InviteIdParamSchema,
		body: {
			content: {
				[mediaTypeFormat.json]: {
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
				[mediaTypeFormat.json]: {
					schema: SendOfferResponseSchema,
				},
			},
		},
		400: {
			description:
				"Bad request - Insufficient balance, job not open, invite not accepted, or offer already exists",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not job owner",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Invite not found",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// POST /api/offer/:offerId/accept - Accept offer (Contractor only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.offer.basepath}/{offerId}/accept`,
	description:
		"Contractor accepts an offer. Platform fee (5%) is transferred to admin. Job status changes to 'assigned'. All other applications are rejected.",
	summary: "Accept offer",
	tags: [openAPITags.offer.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: OfferIdParamSchema,
	},
	responses: {
		200: {
			description:
				"Offer accepted successfully. Platform fee transferred. Job assigned.",
			content: {
				[mediaTypeFormat.json]: {
					schema: AcceptOfferResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Offer not found or already processed",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not offer recipient",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// POST /api/offer/:offerId/reject - Reject offer (Contractor only)
registry.registerPath({
	method: "post",
	path: `${openAPITags.offer.basepath}/{offerId}/reject`,
	description:
		"Contractor rejects an offer with a reason. Full refund (job amount + platform fee) is returned to customer wallet. Application status is reset.",
	summary: "Reject offer",
	tags: [openAPITags.offer.name],
	security: [{ bearerAuth: [] }],
	request: {
		params: OfferIdParamSchema,
		body: {
			content: {
				[mediaTypeFormat.json]: {
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
				[mediaTypeFormat.json]: {
					schema: RejectOfferResponseSchema,
				},
			},
		},
		400: {
			description: "Bad request - Offer not found or already processed",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - not offer recipient",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
