import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Test notification request schema
export const TestNotificationSchema = z
  .object({
    userId: z
      .string()
      .min(1)
      .openapi({ description: "User ID to send test notification" }),
    title: z
      .string()
      .min(1)
      .optional()
      .openapi({ description: "Custom notification title" }),
    body: z
      .string()
      .min(1)
      .optional()
      .openapi({ description: "Custom notification body" }),
  })
  .openapi("TestNotification");

// Response schema
export const TestNotificationResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z
      .object({
        success: z.boolean(),
        message: z.string(),
      })
      .nullable(),
  })
  .openapi("TestNotificationResponse");

export const ErrorResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.null(),
  })
  .openapi("ErrorResponse");

// Export types
export type TestNotification = z.infer<typeof TestNotificationSchema>;
