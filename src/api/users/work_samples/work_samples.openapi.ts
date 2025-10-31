import { mediaTypeFormat } from "@/common/constants";
import { registry } from "@/lib/openapi";
import {
	CreateWorkSampleSchema,
	ErrorResponseSchema,
	UpdateWorkSampleSchema,
	WorkSampleIdSchema,
	WorkSampleResponseSchema,
	WorkSamplesResponseSchema,
} from "./work_samples.validation";

// Register schemas
registry.register("CreateWorkSample", CreateWorkSampleSchema);
registry.register("UpdateWorkSample", UpdateWorkSampleSchema);
registry.register("WorkSampleIdParam", WorkSampleIdSchema);
registry.register("WorkSampleResponse", WorkSampleResponseSchema);
registry.register("WorkSamplesResponse", WorkSamplesResponseSchema);
registry.register("WorkSampleErrorResponse", ErrorResponseSchema);

// GET /api/user/work-samples - Get all work samples
registry.registerPath({
	method: "get",
	path: "/api/user/work-samples",
	description: "Get all work samples for the authenticated user",
	summary: "Get user work samples",
	tags: ["User - Work Samples"],
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: "Work samples retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: WorkSamplesResponseSchema,
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

// GET /api/user/work-samples/:id - Get single work sample
registry.registerPath({
	method: "get",
	path: "/api/user/work-samples/{id}",
	description: "Get a single work sample by ID",
	summary: "Get work sample",
	tags: ["User - Work Samples"],
	security: [{ bearerAuth: [] }],
	request: {
		params: WorkSampleIdSchema,
	},
	responses: {
		200: {
			description: "Work sample retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: WorkSampleResponseSchema,
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
			description: "Work sample not found",
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

// POST /api/user/work-samples - Create work sample
registry.registerPath({
	method: "post",
	path: "/api/user/work-samples",
	description: "Create a new work sample",
	summary: "Create work sample",
	tags: ["User - Work Samples"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: CreateWorkSampleSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Work sample created successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: WorkSampleResponseSchema,
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

// PUT /api/user/work-samples/:id - Update work sample
registry.registerPath({
	method: "put",
	path: "/api/user/work-samples/{id}",
	description: "Update an existing work sample",
	summary: "Update work sample",
	tags: ["User - Work Samples"],
	security: [{ bearerAuth: [] }],
	request: {
		params: WorkSampleIdSchema,
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: UpdateWorkSampleSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Work sample updated successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: WorkSampleResponseSchema,
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
			description: "Work sample not found",
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

// DELETE /api/user/work-samples/:id - Delete work sample
registry.registerPath({
	method: "delete",
	path: "/api/user/work-samples/{id}",
	description: "Delete a work sample",
	summary: "Delete work sample",
	tags: ["User - Work Samples"],
	security: [{ bearerAuth: [] }],
	request: {
		params: WorkSampleIdSchema,
	},
	responses: {
		200: {
			description: "Work sample deleted successfully",
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
			description: "Work sample not found",
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
