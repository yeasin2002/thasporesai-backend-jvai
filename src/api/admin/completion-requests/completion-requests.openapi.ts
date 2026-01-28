import { openAPITags } from "@/common/constants";
import { ErrorResponseSchema } from "@/common/validations";
import { registry } from "@/lib/openapi";
import {
  CompletionRequestIdSchema,
  CompletionRequestResponseSchema,
  CompletionRequestsResponseSchema,
  GetCompletionRequestsSchema,
  RejectCompletionRequestSchema,
} from "./completion-requests.validation";

// Register GET /api/admin/completion-requests
registry.registerPath({
  method: "get",
  path: "/api/admin/completion-requests",
  tags: [openAPITags.admin.user_management.name],
  summary: "Get completion requests",
  description:
    "Get paginated list of completion requests with optional filters",
  request: {
    query: GetCompletionRequestsSchema,
  },
  responses: {
    200: {
      description: "Completion requests retrieved successfully",
      content: {
        "application/json": {
          schema: CompletionRequestsResponseSchema,
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

// Register POST /api/admin/completion-requests/:id/approve
registry.registerPath({
  method: "post",
  path: "/api/admin/completion-requests/{id}/approve",
  tags: [openAPITags.admin.user_management.name],
  summary: "Approve completion request",
  description:
    "Admin approves job completion, transfers funds to contractor via Stripe Connect",
  request: {
    params: CompletionRequestIdSchema,
  },
  responses: {
    200: {
      description: "Completion request approved successfully",
      content: {
        "application/json": {
          schema: CompletionRequestResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request",
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

// Register POST /api/admin/completion-requests/:id/reject
registry.registerPath({
  method: "post",
  path: "/api/admin/completion-requests/{id}/reject",
  tags: [openAPITags.admin.user_management.name],
  summary: "Reject completion request",
  description: "Admin rejects job completion request with reason",
  request: {
    params: CompletionRequestIdSchema,
    body: {
      content: {
        "application/json": {
          schema: RejectCompletionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Completion request rejected successfully",
      content: {
        "application/json": {
          schema: CompletionRequestResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request",
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
