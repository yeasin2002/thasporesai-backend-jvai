import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Send invite schema
export const SendInviteSchema = z
	.object({
		contractorId: z
			.string()
			.min(1, "Contractor ID is required")
			.openapi({ description: "ID of the contractor to invite" }),
		message: z
			.string()
			.optional()
			.openapi({ description: "Optional message to the contractor" }),
	})
	.openapi("SendInvite");

// Reject invite schema
export const RejectInviteSchema = z
	.object({
		rejectionReason: z
			.string()
			.optional()
			.openapi({ description: "Optional reason for rejection" }),
	})
	.openapi("RejectInvite");

// Job ID parameter schema
export const JobIdParamSchema = z
	.object({
		jobId: z
			.string()
			.min(1, "Job ID is required")
			.openapi({ description: "Job ID" }),
	})
	.openapi("JobIdParam");

// Invite ID parameter schema
export const InviteIdParamSchema = z
	.object({
		inviteId: z
			.string()
			.min(1, "Invite ID is required")
			.openapi({ description: "Invite ID" }),
	})
	.openapi("InviteIdParam");

// Search/Filter Query Schema for Sent Invites (Customer)
export const SearchSentInvitesSchema = z
	.object({
		jobId: z
			.string()
			.optional()
			.openapi({ description: "Filter by specific job ID" }),
		status: z
			.enum([
				"pending",
				"accepted",
				"rejected",
				"cancelled",
				"invited",
				"engaged",
				"requested",
				"offered",
			])
			.optional()
			.openapi({
				description:
					"Filter by invite status (supports both old and new status values)",
			}),
		page: z
			.string()
			.regex(/^\d+$/, "Page must be a number")
			.optional()
			.openapi({ description: "Page number" }),
		limit: z
			.string()
			.regex(/^\d+$/, "Limit must be a number")
			.optional()
			.openapi({ description: "Items per page" }),
	})
	.openapi("SearchSentInvites");

// Search/Filter Query Schema for Received Invites (Contractor)
export const SearchReceivedInvitesSchema = z
	.object({
		status: z
			.enum([
				"pending",
				"accepted",
				"rejected",
				"cancelled",
				"invited",
				"engaged",
				"requested",
				"offered",
			])
			.optional()
			.openapi({
				description:
					"Filter by invite status (supports both old and new status values)",
			}),
		page: z
			.string()
			.regex(/^\d+$/, "Page must be a number")
			.optional()
			.openapi({ description: "Page number" }),
		limit: z
			.string()
			.regex(/^\d+$/, "Limit must be a number")
			.optional()
			.openapi({ description: "Items per page" }),
	})
	.openapi("SearchReceivedInvites");

// Search/Filter Query Schema for Available Contractors
export const SearchAvailableContractorsSchema = z
	.object({
		search: z.string().optional().openapi({
			description: "Search in contractor name, bio, or skills",
		}),
		category: z
			.string()
			.optional()
			.openapi({ description: "Filter by category ID" }),
		location: z
			.string()
			.optional()
			.openapi({ description: "Filter by location ID" }),
		minBudget: z
			.string()
			.regex(/^\d+$/, "Must be a number")
			.optional()
			.openapi({ description: "Minimum budget" }),
		maxBudget: z
			.string()
			.regex(/^\d+$/, "Must be a number")
			.optional()
			.openapi({ description: "Maximum budget" }),
		page: z
			.string()
			.regex(/^\d+$/, "Page must be a number")
			.optional()
			.openapi({ description: "Page number" }),
		limit: z
			.string()
			.regex(/^\d+$/, "Limit must be a number")
			.optional()
			.openapi({ description: "Items per page" }),
	})
	.openapi("SearchAvailableContractors");

// Invite data schema
const InviteDataSchema = z.object({
	_id: z.string(),
	job: z.any(),
	customer: z.any(),
	contractor: z.any(),
	status: z.enum(["invited", "requested", "engaged", "offered", "cancelled"]),
	sender: z.string(),
	offerId: z.string().optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

// Response schemas
export const InviteResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: InviteDataSchema,
	})
	.openapi("InviteResponse");

export const InvitesResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.object({
			invites: z.array(InviteDataSchema),
			total: z.number().openapi({ description: "Total number of invites" }),
			page: z.number().openapi({ description: "Current page" }),
			limit: z.number().openapi({ description: "Items per page" }),
			totalPages: z.number().openapi({ description: "Total pages" }),
		}),
	})
	.openapi("InvitesResponse");

export const SuccessResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
	})
	.openapi("SuccessResponse");

export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
	})
	.openapi("ErrorResponse");

// Type exports
export type SendInvite = z.infer<typeof SendInviteSchema>;
export type RejectInvite = z.infer<typeof RejectInviteSchema>;
export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type InviteIdParam = z.infer<typeof InviteIdParamSchema>;
export type SearchSentInvites = z.infer<typeof SearchSentInvitesSchema>;
export type SearchReceivedInvites = z.infer<typeof SearchReceivedInvitesSchema>;
export type SearchAvailableContractors = z.infer<
	typeof SearchAvailableContractorsSchema
>;
export type InviteResponse = z.infer<typeof InviteResponseSchema>;
export type InvitesResponse = z.infer<typeof InvitesResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
