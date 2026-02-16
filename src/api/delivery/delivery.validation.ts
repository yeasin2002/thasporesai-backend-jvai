import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Request schemas
export const CompleteDeliverySchema = z
  .object({
    jobId: z
      .string()
      .min(1, "Job ID is required")
      .openapi({ description: "ID of the job to mark as complete" }),
  })
  .openapi("CompleteDelivery");

// Response schemas
export const JobResponseSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    status: z.string(),
    completedAt: z.string(),
  })
  .openapi("JobResponse");

export const PaymentBreakdownSchema = z
  .object({
    jobAmount: z.number(),
    serviceFee: z.number(),
    contractorPayout: z.number(),
    platformFee: z.number(),
    totalAdminCommission: z.number(),
  })
  .openapi("PaymentBreakdown");

export const WalletBalanceSchema = z
  .object({
    balance: z.number(),
    totalEarnings: z.number().optional(),
  })
  .openapi("WalletBalance");

export const CompleteDeliveryResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({
      completionRequest: z.object({
        _id: z.string(),
        job: z.string(),
        customer: z.string(),
        contractor: z.string(),
        offer: z.string(),
        status: z.string(),
        requestedAt: z.string(),
      }),
      job: JobResponseSchema,
      payment: PaymentBreakdownSchema,
      message: z.string(),
    }),
  })
  .openapi("CompleteDeliveryResponse");

export const ErrorResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.null(),
  })
  .openapi("DeliveryErrorResponse");

// Export types
export type CompleteDelivery = z.infer<typeof CompleteDeliverySchema>;
export type CompleteDeliveryResponse = z.infer<
  typeof CompleteDeliveryResponseSchema
>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
