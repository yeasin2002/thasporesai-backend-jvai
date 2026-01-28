import { objectIdSchema } from "@/common/validations";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Completion Request Schema
export const CompletionRequestSchema = z
  .object({
    _id: objectIdSchema.openapi({ description: "Completion request ID" }),
    job: objectIdSchema.openapi({ description: "Job ID" }),
    offer: objectIdSchema.openapi({ description: "Offer ID" }),
    customer: objectIdSchema.openapi({ description: "Customer ID" }),
    contractor: objectIdSchema.openapi({ description: "Contractor ID" }),
    status: z
      .enum(["pending", "approved", "rejected"])
      .openapi({ description: "Request status" }),
    approvedBy: objectIdSchema
      .optional()
      .openapi({ description: "Admin who approved" }),
    rejectedBy: objectIdSchema
      .optional()
      .openapi({ description: "Admin who rejected" }),
    rejectionReason: z
      .string()
      .optional()
      .openapi({ description: "Reason for rejection" }),
    approvedAt: z
      .string()
      .optional()
      .openapi({ description: "Approval timestamp" }),
    rejectedAt: z
      .string()
      .optional()
      .openapi({ description: "Rejection timestamp" }),
    createdAt: z.string().openapi({ description: "Creation timestamp" }),
    updatedAt: z.string().openapi({ description: "Last update timestamp" }),
  })
  .openapi("CompletionRequest");

// Get Completion Requests Query Schema
export const GetCompletionRequestsSchema = z
  .object({
    status: z
      .enum(["pending", "approved", "rejected"])
      .optional()
      .openapi({ description: "Filter by status" }),
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
  .openapi("GetCompletionRequests");

// Completion Request ID Param Schema
export const CompletionRequestIdSchema = z
  .object({
    id: objectIdSchema.openapi({ description: "Completion request ID" }),
  })
  .openapi("CompletionRequestIdParam");

// Approve Completion Request Schema
export const ApproveCompletionRequestSchema = z
  .object({})
  .openapi("ApproveCompletionRequest");

// Reject Completion Request Schema
export const RejectCompletionRequestSchema = z
  .object({
    reason: z
      .string()
      .min(1, "Rejection reason is required")
      .openapi({ description: "Reason for rejection" }),
  })
  .openapi("RejectCompletionRequest");

// Response Schemas
export const CompletionRequestResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: CompletionRequestSchema.nullable(),
  })
  .openapi("CompletionRequestResponse");

export const CompletionRequestsResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({
      requests: z.array(CompletionRequestSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
      }),
    }),
  })
  .openapi("CompletionRequestsResponse");

// Type exports
export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;
export type GetCompletionRequests = z.infer<typeof GetCompletionRequestsSchema>;
export type RejectCompletionRequest = z.infer<
  typeof RejectCompletionRequestSchema
>;
