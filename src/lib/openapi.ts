// import {
//   CreateUserSchema,
//   ErrorResponseSchema,
//   UpdateUserSchema,
//   UserIdSchema,
//   UserResponseSchema,
//   UsersResponseSchema,
// } from "@/api/user/user.schema";
import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

// helper function to generate the OpenAPI document
export const generateOpenAPIDocument = () => {
	const generator = new OpenApiGeneratorV3(registry.definitions);
	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			title: "Providus Org API",
			version: "1.0.0",
			description: "Backend API service for Providus Organization",
		},
		servers: [
			{
				url: process.env.API_BASE_URL || "http://localhost:4000",
				description: "Development server",
			},
		],
	});
};
