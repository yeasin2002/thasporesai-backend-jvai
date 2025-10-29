import { mediaTypeFormat, openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";
import {
	ErrorResponseSchema,
	UserQuerySchema,
	UserResponseSchema,
	UsersResponseSchema,
} from "./users.validation";

// GET /api/users - Get all users with pagination
registry.registerPath({
	method: "get",
	path: openAPITags.user.all_users.basepath,
	description:
		"Get all users with optional search, filters, and pagination. Supports filtering by role, location, category, and searching by name or email.",
	summary: "Retrieve all users with pagination",
	tags: [openAPITags.user.all_users.name],
	request: {
		query: UserQuerySchema,
	},
	responses: {
		200: {
			description: "Users retrieved successfully with pagination metadata",
			content: {
				[mediaTypeFormat.json]: {
					schema: UsersResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// GET /api/auth/me
registry.registerPath({
	method: "get",
	path: openAPITags.user.me.basepath,
	description: "Get current authenticated user",
	summary: "Get current user",
	tags: [openAPITags.user.me.name],
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: "User retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: UserResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "User not found",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// Register security scheme for bearer auth
registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "JWT access token",
});
