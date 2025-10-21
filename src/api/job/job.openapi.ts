import { registry } from "@/lib/openapi";
import {
	CreateJobSchema,
	ErrorResponseSchema,
	JobIdSchema,
	JobResponseSchema,
	JobsResponseSchema,
	SearchJobSchema,
	SuccessResponseSchema,
	UpdateJobSchema,
} from "./job.validation";

// Register schemas
registry.register("CreateJob", CreateJobSchema);
registry.register("UpdateJob", UpdateJobSchema);
registry.register("JobIdParam", JobIdSchema);
registry.register("SearchJob", SearchJobSchema);
registry.register("JobResponse", JobResponseSchema);
registry.register("JobsResponse", JobsResponseSchema);
registry.register("SuccessResponse", SuccessResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// GET /api/job - Get all jobs with search and filters
registry.registerPath({
	method: "get",
	path: "/api/job",
	description: "Get all jobs with optional search and filters",
	summary: "Get all jobs",
	tags: ["Jobs"],
	request: {
		query: SearchJobSchema,
	},
	responses: {
		200: {
			description: "Jobs retrieved successfully",
			content: {
				"application/json": {
					schema: JobsResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// GET /api/job/:id - Get job by ID
registry.registerPath({
	method: "get",
	path: "/api/job/{id}",
	description: "Get a single job by ID",
	summary: "Get job by ID",
	tags: ["Jobs"],
	request: {
		params: JobIdSchema,
	},
	responses: {
		200: {
			description: "Job retrieved successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// GET /api/job/my/jobs - Get customer's own jobs
registry.registerPath({
	method: "get",
	path: "/api/job/my/jobs",
	description: "Get all jobs posted by the authenticated customer",
	summary: "Get my jobs",
	tags: ["Jobs"],
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: "Jobs retrieved successfully",
			content: {
				"application/json": {
					schema: JobsResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Customer only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// POST /api/job - Create job (Customer only)
registry.registerPath({
	method: "post",
	path: "/api/job",
	description: "Create a new job (Customer only)",
	summary: "Create job",
	tags: ["Jobs"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateJobSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Job created successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error or invalid categories",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Customer only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// PUT /api/job/:id - Update job (Owner or Admin)
registry.registerPath({
	method: "put",
	path: "/api/job/{id}",
	description: "Update a job (Owner or Admin only)",
	summary: "Update job",
	tags: ["Jobs"],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateJobSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Job updated successfully",
			content: {
				"application/json": {
					schema: JobResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error or invalid categories",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Owner or Admin only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// DELETE /api/job/:id - Delete job (Owner or Admin)
registry.registerPath({
	method: "delete",
	path: "/api/job/{id}",
	description: "Delete a job (Owner or Admin only)",
	summary: "Delete job",
	tags: ["Jobs"],
	security: [{ bearerAuth: [] }],
	request: {
		params: JobIdSchema,
	},
	responses: {
		200: {
			description: "Job deleted successfully",
			content: {
				"application/json": {
					schema: SuccessResponseSchema,
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - Owner or Admin only",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Job not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
