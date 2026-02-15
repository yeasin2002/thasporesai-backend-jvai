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
      .positive("Amount must be positive number")
      .openapi({ description: "Job budget amount" }),
    timeline: z
      .string()
      .min(1, "Timeline is required")
      .openapi({ description: "Expected completion time" }),
    description: z
      .string()
      .optional()
      .openapi({ description: "Work description" }),
  })
  .openapi("SendOffer");

// Send direct job offer schema (includes contractorId)
export const SendDirectJobOfferSchema = z
  .object({
    contractorId: z
      .string()
      .min(1, "Contractor ID is required")
      .openapi({ description: "Contractor user ID" }),
    amount: z
      .number()
      .positive("Amount must be positive number")
      .openapi({ description: "Job budget amount" }),
    timeline: z
      .string()
      .min(1, "Timeline is required")
      .openapi({ description: "Expected completion time" }),
    description: z
      .string()
      .optional()
      .openapi({ description: "Work description" }),
  })
  .openapi("SendDirectJobOffer");

// Job ID parameter schema
export const JobIdParamSchema = z
  .object({
    jobId: z
      .string()
      .min(1, "Job ID is required")
      .openapi({ description: "Job ID" }),
  })
  .openapi("JobIdParam");

// Application ID parameter schema (for sending offer based on application)
export const ApplicationIdParamSchema = z
  .object({
    applicationId: z
      .string()
      .min(1, "Application ID is required")
      .openapi({ description: "Application ID" }),
  })
  .openapi("ApplicationIdParam");

// Invite ID parameter schema (for sending offer based on invite)
export const InviteIdParamSchema = z
  .object({
    inviteId: z
      .string()
      .min(1, "Invite ID is required")
      .openapi({ description: "Job Invite ID" }),
  })
  .openapi("InviteIdParam");

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

// Cancel offer schema
export const CancelOfferSchema = z
  .object({
    customer: z
      .string()
      .min(1, "Customer ID is required")
      .openapi({ description: "Customer user ID" }),
    contractor: z
      .string()
      .min(1, "Contractor ID is required")
      .openapi({ description: "Contractor user ID" }),
    jobId: z
      .string()
      .min(1, "Job ID is required")
      .openapi({ description: "Job ID" }),
    reason: z
      .string()
      .optional()
      .openapi({ description: "Reason for cancelling the offer" }),
  })
  .openapi("CancelOffer");

// Response schemas
export const CancelOfferResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({
      offer: z.object({
        _id: z.string(),
        status: z.string(),
        cancelledAt: z.string(),
        cancellationReason: z.string().optional(),
      }),
      message: z.string(),
    }),
  })
  .openapi("CancelOfferResponse");

export const ErrorResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.null(),
  })
  .openapi("OfferErrorResponse");

// Export types
export type SendOffer = z.infer<typeof SendOfferSchema>;
export type SendDirectJobOffer = z.infer<typeof SendDirectJobOfferSchema>;
export type ApplicationIdParam = z.infer<typeof ApplicationIdParamSchema>;
export type InviteIdParam = z.infer<typeof InviteIdParamSchema>;
export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type OfferIdParam = z.infer<typeof OfferIdParamSchema>;
export type RejectOffer = z.infer<typeof RejectOfferSchema>;
export type CancelOffer = z.infer<typeof CancelOfferSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
