import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Base user schema
export const UserSchema = z.object({
  _id: z.string().openapi({ description: "User ID" }),
  name: z
    .string()
    .min(1, "Name is required")
    .openapi({ description: "User's full name" }),
  email: z
    .string()
    .email("Invalid email format")
    .openapi({ description: "User's email address" }),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .openapi({ description: "User's password" }),
  createdAt: z.date().optional().openapi({ description: "Creation timestamp" }),
  updatedAt: z
    .date()
    .optional()
    .openapi({ description: "Last update timestamp" }),
});

// Schema for creating a user (without _id, createdAt, updatedAt)
export const CreateUserSchema = UserSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
}).openapi("CreateUser");

// Schema for updating a user (all fields optional except password requirements)
export const UpdateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
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
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
