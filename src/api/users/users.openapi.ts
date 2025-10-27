import { mediaTypeFormat, openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";
import { ErrorResponseSchema, UserResponseSchema } from "./users.validation";

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
