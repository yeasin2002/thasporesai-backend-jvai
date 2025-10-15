import {
  CreateUserSchema,
  ErrorResponseSchema,
  UpdateUserSchema,
  UserIdSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from "@/api/user/user.schema";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

// Register user schemas
registry.register("CreateUser", CreateUserSchema);
registry.register("UpdateUser", UpdateUserSchema);
registry.register("UserIdParam", UserIdSchema);
registry.register("UserResponse", UserResponseSchema);
registry.register("UsersResponse", UsersResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// Register user routes
registry.registerPath({
  method: "get",
  path: "/api/user",
  description: "Get all users",
  summary: "Retrieve all users",
  tags: ["Users"],
  responses: {
    200: {
      description: "Users retrieved successfully",
      content: {
        "application/json": {
          schema: UsersResponseSchema,
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

registry.registerPath({
  method: "post",
  path: "/api/user",
  description: "Create a new user",
  summary: "Create user",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: UserResponseSchema,
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

registry.registerPath({
  method: "put",
  path: "/api/user/{id}",
  description: "Update a user",
  summary: "Update user",
  tags: ["Users"],
  request: {
    params: UserIdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User updated successfully",
      content: {
        "application/json": {
          schema: UserResponseSchema,
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

registry.registerPath({
  method: "delete",
  path: "/api/user/{id}",
  description: "Delete a user",
  summary: "Delete user",
  tags: ["Users"],
  request: {
    params: UserIdSchema,
  },
  responses: {
    200: {
      description: "User deleted successfully",
      content: {
        "application/json": {
          schema: UserResponseSchema,
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
