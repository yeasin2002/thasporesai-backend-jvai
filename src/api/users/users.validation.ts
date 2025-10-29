import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Location schema (populated)
const LocationSchema = z.object({
	_id: z.string(),
	name: z.string(),
	state: z.string().optional(),
	coordinates: z
		.object({
			latitude: z.number(),
			longitude: z.number(),
		})
		.optional(),
});

// Category schema (populated)
const CategorySchema = z.object({
	_id: z.string(),
	name: z.string(),
	icon: z.string().optional(),
	description: z.string().optional(),
});

// Review schema (populated)
const ReviewSchema = z.object({
	_id: z.string(),
	rating: z.number(),
	comment: z.string().optional(),
	reviewer: z.string().optional(),
	createdAt: z.coerce.date().optional(),
});

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

// User Response Schema (without password, refreshTokens, otp)
export const UserDataSchema = z
  .object({
    _id: z.string().openapi({ description: "User ID" }),
    role: z
      .enum(["customer", "contractor", "admin"])
      .openapi({ description: "User role" }),
    full_name: z.string().openapi({ description: "User's full name" }),
    profile_img: z
      .string()
      .optional()
      .openapi({ description: "Profile image URL" }),
    cover_img: z
      .string()
      .optional()
      .openapi({ description: "Cover image URL" }),
    email: z.string().openapi({ description: "User's email address" }),
    phone: z
      .string()
      .optional()
      .openapi({ description: "User's phone number" }),
    bio: z.string().optional().openapi({ description: "User biography" }),
    location: z
      .array(LocationSchema)
      .optional()
      .openapi({ description: "Populated location details" }),
    availability: z.coerce
      .date()
      .optional()
      .openapi({ description: "Availability date" }),
    is_verified: z.boolean().openapi({ description: "Verification status" }),
    isSuspend: z
      .boolean()
      .optional()
      .openapi({ description: "Suspension status" }),
    category: z
      .array(CategorySchema)
      .optional()
      .openapi({ description: "Populated category details" }),
    review: z
      .array(ReviewSchema)
      .optional()
      .openapi({ description: "Populated review details" }),
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
      .openapi({ description: "Portfolio work samples" }),
    starting_budget: z
      .number()
      .optional()
      .openapi({ description: "Starting budget for projects" }),
    certification: z
      .string()
      .optional()
      .openapi({ description: "Professional certifications" }),
    hourly_charge: z
      .number()
      .optional()
      .openapi({ description: "Hourly rate" }),
    createdAt: z.coerce
      .date()
      .optional()
      .openapi({ description: "Account creation date" }),
    updatedAt: z.coerce
      .date()
      .optional()
      .openapi({ description: "Last update date" }),
  })
  .openapi("UserData");

// User query schema for filtering with pagination
export const UserQuerySchema = z
	.object({
		search: z.string().optional().openapi({
			description: "Search by full name or email (case-insensitive)",
		}),
		role: z
			.enum(["contractor", "customer", "admin"])
			.optional()
			.openapi({ description: "Filter by user role" }),
		location: z
			.string()
			.refine((val) => !val || isValidObjectId(val), {
				message: "Invalid location ID format",
			})
			.optional()
			.openapi({ description: "Filter by location ID" }),
		category: z
			.string()
			.refine((val) => !val || isValidObjectId(val), {
				message: "Invalid category ID format",
			})
			.optional()
			.openapi({ description: "Filter by category ID" }),
		page: z
			.string()
			.optional()
			.transform((val) => (val ? Number.parseInt(val, 10) : 1))
			.openapi({ description: "Page number (default: 1)" }),
		limit: z
			.string()
			.optional()
			.transform((val) => (val ? Number.parseInt(val, 10) : 10))
			.openapi({ description: "Items per page (default: 10)" }),
		sortBy: z
			.string()
			.optional()
			.openapi({ description: "Sort field (default: createdAt)" }),
		sortOrder: z
			.enum(["asc", "desc"])
			.optional()
			.openapi({ description: "Sort order (default: desc)" }),
	})
	.openapi("UserQuery");

// Pagination metadata schema
export const PaginationSchema = z.object({
	currentPage: z.number(),
	totalPages: z.number(),
	totalUsers: z.number(),
	limit: z.number(),
	hasNextPage: z.boolean(),
	hasPrevPage: z.boolean(),
});

// Response schemas
export const UserResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		success: z.boolean(),
		data: UserDataSchema,
	})
	.openapi("UserResponse");

export const UsersResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		success: z.boolean(),
		data: z.object({
			users: z.array(UserDataSchema),
			pagination: PaginationSchema,
		}),
	})
	.openapi("UsersResponse");

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

// Type exports
export type UserQuery = z.infer<typeof UserQuerySchema>;
