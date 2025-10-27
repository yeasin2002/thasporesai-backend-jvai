import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// User Response Schema (without password)
export const UserDataSchema = z
	.object({
		_id: z.string().openapi({ description: "User ID" }),
		full_name: z.string().openapi({ description: "User's full name" }),
		email: z.string().openapi({ description: "User's email address" }),
		role: z
			.enum(["customer", "contractor", "admin"])
			.openapi({ description: "User role" }),
		phone: z
			.string()
			.optional()
			.openapi({ description: "User's phone number" }),
		is_verified: z.boolean().openapi({ description: "Verification status" }),
		createdAt: z.string().openapi({ description: "Account creation date" }),
		updatedAt: z.string().openapi({ description: "Last update date" }),
	})
	.openapi("UserData");

// Auth R

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);
export const UserResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		success: z.boolean(),
		data: UserDataSchema,
	})
	.openapi("UserResponse");

// Error Response Schema
export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null().optional(),
		success: z.boolean(),
		errors: z
			.array(
				z.object({
					path: z.string(),
					message: z.string(),
				}),
			)
			.optional(),
	})
	.openapi("ErrorResponse");
