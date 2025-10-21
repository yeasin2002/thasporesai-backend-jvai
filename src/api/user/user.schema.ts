import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Experience schema
const ExperienceSchema = z.object({
	company_name: z.string(),
	start_date: z.coerce.date(),
	end_date: z.coerce.date().optional(),
});

// Work sample schema
const WorkSampleSchema = z.object({
	name: z.string(),
	img: z.string(),
	description: z.string().optional(),
});

// Base user schema
export const UserSchema = z.object({
	_id: z.string().openapi({ description: "User ID" }),
	role: z
		.enum(["contractor", "customer", "admin"])
		.openapi({ description: "User role" }),
	full_name: z
		.string()
		.min(1, "Full name is required")
		.openapi({ description: "User's full name" }),
	profile_img: z
		.string()
		.optional()
		.openapi({ description: "Profile image URL" }),
	cover_img: z.string().optional().openapi({ description: "Cover image URL" }),
	email: z
		.string()
		.email("Invalid email format")
		.openapi({ description: "User's email address" }),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.openapi({ description: "User's password" }),
	phone: z.string().optional().openapi({ description: "Phone number" }),
	bio: z.string().optional().openapi({ description: "User biography" }),
	location: z.string().optional().openapi({ description: "User location" }),
	availability: z.coerce
		.date()
		.optional()
		.openapi({ description: "Availability status" }),
	is_verified: z.boolean().openapi({ description: "Verification status" }),
	category: z
		.array(z.string())
		.optional()
		.openapi({ description: "Category IDs" }),
	// Contractor specific fields
	skills: z
		.array(z.string())
		.optional()
		.openapi({ description: "Contractor skills" }),
	experience: z
		.array(ExperienceSchema)
		.optional()
		.openapi({ description: "Work experience" }),
	work_samples: z
		.array(WorkSampleSchema)
		.optional()
		.openapi({ description: "Portfolio samples" }),
	starting_budget: z
		.number()
		.optional()
		.openapi({ description: "Starting budget" }),
	certification: z
		.string()
		.optional()
		.openapi({ description: "Certification documents" }),
	hourly_charge: z.number().optional().openapi({ description: "Hourly rate" }),
	createdAt: z.coerce
		.date()
		.optional()
		.openapi({ description: "Creation timestamp" }),
	updatedAt: z.coerce
		.date()
		.optional()
		.openapi({ description: "Last update timestamp" }),
});

// Schema for creating a user (without _id, createdAt, updatedAt, is_verified)
export const CreateUserSchema = UserSchema.omit({
	_id: true,
	createdAt: true,
	updatedAt: true,
	is_verified: true,
}).openapi("CreateUser");

// Schema for updating a user (all fields optional)
export const UpdateUserSchema = z
	.object({
		role: z.enum(["contractor", "customer", "admin"]).optional(),
		full_name: z.string().min(1, "Full name is required").optional(),
		profile_img: z.string().optional(),
		cover_img: z.string().optional(),
		email: z.string().email("Invalid email format").optional(),
		password: z
			.string()
			.min(6, "Password must be at least 6 characters")
			.optional(),
		phone: z.string().optional(),
		bio: z.string().optional(),
		location: z.string().optional(),
		availability: z.coerce.date().optional(),
		is_verified: z.boolean().optional(),
		category: z.array(z.string()).optional(),
		skills: z.array(z.string()).optional(),
		experience: z.array(ExperienceSchema).optional(),
		work_samples: z.array(WorkSampleSchema).optional(),
		starting_budget: z.number().optional(),
		certification: z.string().optional(),
		hourly_charge: z.number().optional(),
	})
	.openapi("UpdateUser");

// Schema for user ID parameter
export const UserIdSchema = z
	.object({
		id: z
			.string()
			.min(1, "User ID is required")
			.openapi({ description: "User ID" }),
	})
	.openapi("UserIdParam");

// Schema for user query parameters
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

// Response schemas
export const UserResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: UserSchema.nullable(),
	})
	.openapi("UserResponse");

export const UsersResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.array(UserSchema),
	})
	.openapi("UsersResponse");

export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
	})
	.openapi("ErrorResponse");

// Type exports
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
