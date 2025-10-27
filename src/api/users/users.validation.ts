import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

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
        })
      )
      .optional(),
  })
  .openapi("ErrorResponse");

// Type exports
export type UserQuery = z.infer<typeof UserQuerySchema>;
