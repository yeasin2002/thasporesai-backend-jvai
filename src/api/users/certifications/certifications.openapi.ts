import { mediaTypeFormat } from "@/common/constants";
import { registry } from "@/lib/openapi";
import {
	CertificationIdSchema,
	CertificationResponseSchema,
	CertificationsResponseSchema,
	CreateCertificationSchema,
	ErrorResponseSchema,
	UpdateCertificationSchema,
} from "./certifications.validation";

// Register schemas
registry.register("CreateCertification", CreateCertificationSchema);
registry.register("UpdateCertification", UpdateCertificationSchema);
registry.register("CertificationIdParam", CertificationIdSchema);
registry.register("CertificationResponse", CertificationResponseSchema);
registry.register("CertificationsResponse", CertificationsResponseSchema);
registry.register("CertificationErrorResponse", ErrorResponseSchema);

// GET /api/user/certifications - Get all certifications
registry.registerPath({
	method: "get",
	path: "/api/user/certifications",
	description: "Get all certifications for the authenticated user",
	summary: "Get user certifications",
	tags: ["User - Certifications"],
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: "Certifications retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: CertificationsResponseSchema,
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

// GET /api/user/certifications/:id - Get single certification
registry.registerPath({
	method: "get",
	path: "/api/user/certifications/{id}",
	description: "Get a single certification by ID",
	summary: "Get certification",
	tags: ["User - Certifications"],
	security: [{ bearerAuth: [] }],
	request: {
		params: CertificationIdSchema,
	},
	responses: {
		200: {
			description: "Certification retrieved successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: CertificationResponseSchema,
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
			description: "Certification not found",
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

// POST /api/user/certifications - Create certification
registry.registerPath({
	method: "post",
	path: "/api/user/certifications",
	description: "Create a new certification",
	summary: "Create certification",
	tags: ["User - Certifications"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: CreateCertificationSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Certification created successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: CertificationResponseSchema,
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

// PUT /api/user/certifications/:id - Update certification
registry.registerPath({
	method: "put",
	path: "/api/user/certifications/{id}",
	description: "Update an existing certification",
	summary: "Update certification",
	tags: ["User - Certifications"],
	security: [{ bearerAuth: [] }],
	request: {
		params: CertificationIdSchema,
		body: {
			content: {
				[mediaTypeFormat.json]: {
					schema: UpdateCertificationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Certification updated successfully",
			content: {
				[mediaTypeFormat.json]: {
					schema: CertificationResponseSchema,
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
			description: "Certification not found",
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

// DELETE /api/user/certifications/:id - Delete certification
registry.registerPath({
	method: "delete",
	path: "/api/user/certifications/{id}",
	description: "Delete a certification",
	summary: "Delete certification",
	tags: ["User - Certifications"],
	security: [{ bearerAuth: [] }],
	request: {
		params: CertificationIdSchema,
	},
	responses: {
		200: {
			description: "Certification deleted successfully",
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
			description: "Certification not found",
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
