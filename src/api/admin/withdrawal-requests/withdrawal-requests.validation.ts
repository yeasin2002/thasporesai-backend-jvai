import { objectIdSchema } from "@/common/validations";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Withdrawal Request Schema
export const WithdrawalRequestSchema = z
  .object({
    _id: objectIdSchema.openapi({ description: "Withdrawal request ID" }),
    contractor: objectIdSchema.openapi({ description: "Contractor ID" }),
    amount: z.number().openapi({ description: "Withdrawal amount" }),
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
    stripeTransferId: z
      .string()
      .optional()
      .openapi({ description: "Stripe transfer ID" }),
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
  .openapi("WithdrawalRequest");

// Get Withdrawal Requests Query Schema
export const GetWithdrawalRequestsSchema = z
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
  .openapi("GetWithdrawalRequests");

// Withdrawal Request ID Param Schema
export const WithdrawalRequestIdSchema = z
  .object({
    id: objectIdSchema.openapi({ description: "Withdrawal request ID" }),
  })
  .openapi("WithdrawalRequestIdParam");

// Reject Withdrawal Request Schema
export const RejectWithdrawalRequestSchema = z
  .object({
    reason: z
      .string()
      .min(1, "Rejection reason is required")
      .openapi({ description: "Reason for rejection" }),
  })
  .openapi("RejectWithdrawalRequest");

// Response Schemas
export const WithdrawalRequestResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: WithdrawalRequestSchema.nullable(),
  })
  .openapi("WithdrawalRequestResponse");

export const WithdrawalRequestsResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({
      requests: z.array(WithdrawalRequestSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
      }),
    }),
  })
  .openapi("WithdrawalRequestsResponse");

// Type exports
export type WithdrawalRequest = z.infer<typeof WithdrawalRequestSchema>;
export type GetWithdrawalRequests = z.infer<typeof GetWithdrawalRequestsSchema>;
export type RejectWithdrawalRequest = z.infer<
  typeof RejectWithdrawalRequestSchema
>;
