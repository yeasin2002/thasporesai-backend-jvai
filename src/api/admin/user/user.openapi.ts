import { registry } from "@/lib/openapi";
import { openAPITags } from "@/shared/constants";
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
  path: `${openAPITags.admin.user_management.basepath}s`,
  description: "Get all users with optional search and role filter",
  summary: "Retrieve all users",
  tags: [openAPITags.admin.user_management.name],
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
  path: `${openAPITags.admin.user_management.basepath}s/{id}`,
  description: "Get a single user by ID with full details",
  summary: "Retrieve user by ID",
  tags: [openAPITags.admin.user_management.name],
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
  path: `${openAPITags.admin.user_management.basepath}s/{id}`,
  description: "Permanently delete a user account",
  summary: "Delete user account",
  tags: [openAPITags.admin.user_management.name],
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
  path: `${openAPITags.admin.user_management.basepath}s/{id}/suspend`,
  description: "Suspend or unsuspend a user account",
  summary: "Suspend/unsuspend user",
  tags: [openAPITags.admin.user_management.name],
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
