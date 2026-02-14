import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Image upload response schema (server-side upload)
export const ImageUploadResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({
      url: z
        .string()
        .openapi({ description: "Full URL of the uploaded image" }),
      fileId: z.string().openapi({ description: "ImageKit file ID" }),
      filename: z.string().openapi({ description: "Generated filename" }),
      originalName: z.string().openapi({ description: "Original filename" }),
      size: z.number().openapi({ description: "File size in bytes" }),
      mimetype: z.string().openapi({ description: "MIME type of the image" }),
      thumbnailUrl: z
        .string()
        .optional()
        .openapi({ description: "Thumbnail URL" }),
      filePath: z.string().openapi({ description: "File path in ImageKit" }),
    }),
  })
  .openapi("ImageUploadResponse");

// ImageKit auth response schema (client-side upload)
export const ImageKitAuthResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.object({
      token: z
        .string()
        .openapi({ description: "Authentication token for ImageKit" }),
      expire: z
        .number()
        .openapi({ description: "Token expiration timestamp (Unix)" }),
      signature: z
        .string()
        .openapi({ description: "Signature for authentication" }),
      publicKey: z.string().openapi({ description: "ImageKit public key" }),
      urlEndpoint: z.string().openapi({ description: "ImageKit URL endpoint" }),
    }),
  })
  .openapi("ImageKitAuthResponse");

// Error response schema
export const ErrorResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.null(),
  })
  .openapi("ErrorResponse");

// Type exports
export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>;
export type ImageKitAuthResponse = z.infer<typeof ImageKitAuthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
