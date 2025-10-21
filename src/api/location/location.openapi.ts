import { registry } from "@/lib/openapi";
import {
	CreateLocationSchema,
	ErrorResponseSchema,
	LocationIdSchema,
	LocationResponseSchema,
	LocationsResponseSchema,
	UpdateLocationSchema,
} from "./location.validation";

// Register location schemas
registry.register("CreateLocation", CreateLocationSchema);
registry.register("UpdateLocation", UpdateLocationSchema);
registry.register("LocationIdParam", LocationIdSchema);
registry.register("LocationResponse", LocationResponseSchema);
registry.register("LocationsResponse", LocationsResponseSchema);

// GET /api/location - Get all locations
registry.registerPath({
	method: "get",
	path: "/api/location",
	description: "Get all locations",
	summary: "Retrieve all locations",
	tags: ["Location"],
	responses: {
		200: {
			description: "Locations retrieved successfully",
			content: {
				"application/json": {
					schema: LocationsResponseSchema,
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

// GET /api/location/{id} - Get location by ID
registry.registerPath({
	method: "get",
	path: "/api/location/{id}",
	description: "Get a location by ID",
	summary: "Retrieve location by ID",
	tags: ["Location"],
	request: {
		params: LocationIdSchema,
	},
	responses: {
		200: {
			description: "Location retrieved successfully",
			content: {
				"application/json": {
					schema: LocationResponseSchema,
				},
			},
		},
		404: {
			description: "Location not found",
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

// POST /api/location - Create location
registry.registerPath({
	method: "post",
	path: "/api/location",
	description: "Create a new location",
	summary: "Create location",
	tags: ["Location"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateLocationSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Location created successfully",
			content: {
				"application/json": {
					schema: LocationResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error or location already exists",
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

// PUT /api/location/{id} - Update location
registry.registerPath({
	method: "put",
	path: "/api/location/{id}",
	description: "Update a location",
	summary: "Update location",
	tags: ["Location"],
	request: {
		params: LocationIdSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateLocationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Location updated successfully",
			content: {
				"application/json": {
					schema: LocationResponseSchema,
				},
			},
		},
		400: {
			description: "Validation error",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Location not found",
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

// DELETE /api/location/{id} - Delete location
registry.registerPath({
	method: "delete",
	path: "/api/location/{id}",
	description: "Delete a location",
	summary: "Delete location",
	tags: ["Location"],
	request: {
		params: LocationIdSchema,
	},
	responses: {
		200: {
			description: "Location deleted successfully",
			content: {
				"application/json": {
					schema: LocationResponseSchema,
				},
			},
		},
		404: {
			description: "Location not found",
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

// POST /api/location/seed - Seed locations
registry.registerPath({
	method: "post",
	path: "/api/location/seed",
	description: "Seed database with top 50 US cities",
	summary: "Seed locations",
	tags: ["Location"],
	responses: {
		201: {
			description: "Locations seeded successfully",
			content: {
				"application/json": {
					schema: LocationsResponseSchema,
				},
			},
		},
		400: {
			description: "Database already contains locations",
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
