import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Apply for job schema
export const ApplyForJobSchema = z
  .object({
    message: z
      .string()
      .optional()
      .openapi({ description: "Optional message to the job owner" }),
  })
  .openapi("ApplyForJob");

// Job ID parameter schema
export const JobIdParamSchema = z
  .object({
    jobId: z
      .string()
      .min(1, "Job ID is required")
      .openapi({ description: "Job ID" }),
  })
  .openapi("JobIdParam");

// Application ID parameter schema
export const ApplicationIdParamSchema = z
  .object({
    applicationId: z
      .string()
      .min(1, "Application ID is required")
      .openapi({ description: "Application ID" }),
  })
  .openapi("ApplicationIdParam");

// Application data schema
const ApplicationDataSchema = z.object({
  _id: z.string(),
  job: z.any(),
  contractor: z.any(),
  status: z.enum(["pending", "accepted", "rejected"]),
  message: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Response schemas
export const ApplicationResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: ApplicationDataSchema,
  })
  .openapi("ApplicationResponse");

export const ApplicationsResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.array(ApplicationDataSchema),
  })
  .openapi("ApplicationsResponse");

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
export type ApplyForJob = z.infer<typeof ApplyForJobSchema>;
export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type ApplicationIdParam = z.infer<typeof ApplicationIdParamSchema>;
export type ApplicationResponse = z.infer<typeof ApplicationResponseSchema>;
export type ApplicationsResponse = z.infer<typeof ApplicationsResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
