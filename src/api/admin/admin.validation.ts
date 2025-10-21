import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// User ID parameter schema
export const UserIdParamSchema = z
	.object({
		id: z
			.string()
			.min(1, "User ID is required")
			.openapi({ description: "User ID" }),
	})
	.openapi("UserIdParam");

// User query schema for filtering
export const UserQuerySchema = z
	.object({
		search: z
			.string()
			.optional()
			.openapi({ description: "Search by full name (case-insensitive)" }),
		role: z
			.enum(["contractor", "customer", "admin"])
			.optional()
			.openapi({ description: "Filter by user role" }),
	})
	.openapi("UserQuery");

// Suspend user schema
export const SuspendUserSchema = z
	.object({
		suspend: z
			.boolean()
			.openapi({ description: "True to suspend, false to unsuspend" }),
		reason: z
			.string()
			.optional()
			.openapi({ description: "Reason for suspension" }),
	})
	.openapi("SuspendUser");

// User data schema (for response)
const ExperienceSchema = z.object({
	company_name: z.string(),
	start_date: z.coerce.date(),
	end_date: z.coerce.date().optional(),
});

const WorkSampleSchema = z.object({
	name: z.string(),
	img: z.string(),
	description: z.string().optional(),
});

export const UserDataSchema = z.object({
	_id: z.string(),
	role: z.enum(["contractor", "customer", "admin"]),
	full_name: z.string(),
	profile_img: z.string().optional(),
	cover_img: z.string().optional(),
	email: z.string(),
	phone: z.string().optional(),
	bio: z.string().optional(),
	location: z.string().optional(),
	availability: z.coerce.date().optional(),
	is_verified: z.boolean(),
	category: z.array(z.any()).optional(),
	skills: z.array(z.string()).optional(),
	experience: z.array(ExperienceSchema).optional(),
	work_samples: z.array(WorkSampleSchema).optional(),
	starting_budget: z.number().optional(),
	certification: z.string().optional(),
	hourly_charge: z.number().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

// Response schemas
export const UserResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: UserDataSchema.nullable(),
	})
	.openapi("UserResponse");

export const UsersResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.array(UserDataSchema),
	})
	.openapi("UsersResponse");

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
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type SuspendUser = z.infer<typeof SuspendUserSchema>;
export type UserData = z.infer<typeof UserDataSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
