import { registry } from "@/lib/openapi";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  SuspendUserSchema,
  UserIdParamSchema,
  UserQuerySchema,
  UserResponseSchema,
  UsersResponseSchema,
} from "./user.validation";

// Register schemas
registry.register("UserIdParam", UserIdParamSchema);
registry.register("UserQuery", UserQuerySchema);
registry.register("SuspendUser", SuspendUserSchema);
registry.register("AdminUserResponse", UserResponseSchema);
registry.register("AdminUsersResponse", UsersResponseSchema);
registry.register("AdminSuccessResponse", SuccessResponseSchema);
registry.register("AdminErrorResponse", ErrorResponseSchema);

// GET /api/admin/users - Get all users
registry.registerPath({
  method: "get",
  path: "/api/admin/users",
  description: "Get all users with optional search and role filter",
  summary: "Retrieve all users",
  tags: ["Admin - User Management"],
  request: {
    query: UserQuerySchema,
  },
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

// GET /api/admin/users/{id} - Get single user
registry.registerPath({
  method: "get",
  path: "/api/admin/users/{id}",
  description: "Get a single user by ID with full details",
  summary: "Retrieve user by ID",
  tags: ["Admin - User Management"],
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    200: {
      description: "User retrieved successfully",
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
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

// DELETE /api/admin/users/{id} - Delete user
registry.registerPath({
  method: "delete",
  path: "/api/admin/users/{id}",
  description: "Permanently delete a user account",
  summary: "Delete user account",
  tags: ["Admin - User Management"],
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    200: {
      description: "User deleted successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
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

// PATCH /api/admin/users/{id}/suspend - Suspend/unsuspend user
registry.registerPath({
  method: "patch",
  path: "/api/admin/users/{id}/suspend",
  description: "Suspend or unsuspend a user account",
  summary: "Suspend/unsuspend user",
  tags: ["Admin - User Management"],
  request: {
    params: UserIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: SuspendUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User suspension status updated successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
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
