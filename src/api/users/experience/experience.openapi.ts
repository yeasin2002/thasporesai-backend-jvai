import { mediaTypeFormat } from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import {
	CreateExperienceSchema,
	ErrorResponseSchema,
	ExperienceIdSchema,
	ExperienceResponseSchema,
	ExperiencesResponseSchema,
	UpdateExperienceSchema,
} from "./experience.validation";

// Register schemas
registry.register("CreateExperience", CreateExperienceSchema);
registry.register("UpdateExperience", UpdateExperienceSchema);
registry.register("ExperienceIdParam", ExperienceIdSchema);
registry.register("ExperienceResponse", ExperienceResponseSchema);
registry.register("ExperiencesResponse", ExperiencesResponseSchema);
registry.register("ExperienceErrorResponse", ErrorResponseSchema);

// GET /api/user/experience - Get all experiences
registry.registerPath({
	method: "get",
	path: "/api/user/experience",
	description: "Get all work experiences for the authenticated user",
	summary: "Get user experiences",
	tags: ["User - Experience"],
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: "Experiences retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: ExperiencesResponseSchema,
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

// GET /api/user/experience/:id - Get single experience
registry.registerPath({
	method: "get",
	path: "/api/user/experience/{id}",
	description: "Get a single work experience by ID",
	summary: "Get experience",
	tags: ["User - Experience"],
	security: [{ bearerAuth: [] }],
	request: {
		params: ExperienceIdSchema,
	},
	responses: {
		200: {
			description: "Experience retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: ExperienceResponseSchema,
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
			description: "Experience not found",
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

// POST /api/user/experience - Create experience
registry.registerPath({
	method: "post",
	path: "/api/user/experience",
	description: "Create a new work experience",
	summary: "Create experience",
	tags: ["User - Experience"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: CreateExperienceSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Experience created successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: ExperienceResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
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

// PUT /api/user/experience/:id - Update experience
registry.registerPath({
	method: "put",
	path: "/api/user/experience/{id}",
	description: "Update an existing work experience",
	summary: "Update experience",
	tags: ["User - Experience"],
	security: [{ bearerAuth: [] }],
	request: {
		params: ExperienceIdSchema,
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: UpdateExperienceSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Experience updated successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: ExperienceResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
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
			description: "Experience not found",
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

// DELETE /api/user/experience/:id - Delete experience
registry.registerPath({
	method: "delete",
	path: "/api/user/experience/{id}",
	description: "Delete a work experience",
	summary: "Delete experience",
	tags: ["User - Experience"],
	security: [{ bearerAuth: [] }],
	request: {
		params: ExperienceIdSchema,
	},
	responses: {
		200: {
			description: "Experience deleted successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: ErrorResponseSchema,
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
			description: "Experience not found",
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
