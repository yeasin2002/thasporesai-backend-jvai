import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// ============================================
// OFFER SCHEMAS (Payment System)
// ============================================

// Send offer schema
export const SendOfferSchema = z
	.object({
		amount: z
			.number()
			.positive("Amount must be positive")
			.min(10, "Minimum offer amount is $10")
			.max(10000, "Maximum offer amount is $10,000")
			.openapi({ description: "Job budget amount" }),
		timeline: z
			.string()
			.min(1, "Timeline is required")
			.max(100, "Timeline too long")
			.openapi({ description: "Expected completion time" }),
		description: z
			.string()
			.min(10, "Description must be at least 10 characters")
			.max(1000, "Description too long")
			.openapi({ description: "Work description" }),
	})
	.openapi("SendOffer");

// Application ID parameter schema (for sending offer)
export const ApplicationIdParamSchema = z
	.object({
		applicationId: z
			.string()
			.min(1, "Application ID is required")
			.openapi({ description: "Application ID" }),
	})
	.openapi("ApplicationIdParam");

// Offer ID parameter schema
export const OfferIdParamSchema = z
	.object({
		offerId: z.string().min(1).openapi({ description: "Offer ID" }),
	})
	.openapi("OfferIdParam");

// Reject offer schema
export const RejectOfferSchema = z
	.object({
		reason: z.string().min(1).openapi({ description: "Rejection reason" }),
	})
	.openapi("RejectOffer");

// Response schemas
export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
	})
	.openapi("OfferErrorResponse");

// Export types
export type SendOffer = z.infer<typeof SendOfferSchema>;
export type ApplicationIdParam = z.infer<typeof ApplicationIdParamSchema>;
export type OfferIdParam = z.infer<typeof OfferIdParamSchema>;
export type RejectOffer = z.infer<typeof RejectOfferSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
