import { openAPITags } from "@/common/constants";
import { ErrorResponseSchema } from "@/common/validations";
import { registry } from "@/lib/openapi";
import {
  GetWithdrawalRequestsSchema,
  RejectWithdrawalRequestSchema,
  WithdrawalRequestIdSchema,
  WithdrawalRequestResponseSchema,
  WithdrawalRequestsResponseSchema,
} from "./withdrawal-requests.validation";

// Register GET /api/admin/withdrawal-requests
registry.registerPath({
  method: "get",
  path: "/api/admin/withdrawal-requests",
  tags: [openAPITags.admin.user_management.name],
  summary: "Get withdrawal requests",
  description:
    "Get paginated list of withdrawal requests with optional filters",
  request: {
    query: GetWithdrawalRequestsSchema,
  },
  responses: {
    200: {
      description: "Withdrawal requests retrieved successfully",
      content: {
        "application/json": {
          schema: WithdrawalRequestsResponseSchema,
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

// Register POST /api/admin/withdrawal-requests/:id/approve
registry.registerPath({
  method: "post",
  path: "/api/admin/withdrawal-requests/{id}/approve",
  tags: [openAPITags.admin.user_management.name],
  summary: "Approve withdrawal request",
  description:
    "Admin approves withdrawal, deducts from contractor wallet and initiates Stripe Connect transfer",
  request: {
    params: WithdrawalRequestIdSchema,
  },
  responses: {
    200: {
      description: "Withdrawal request approved successfully",
      content: {
        "application/json": {
          schema: WithdrawalRequestResponseSchema,
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

// Register POST /api/admin/withdrawal-requests/:id/reject
registry.registerPath({
  method: "post",
  path: "/api/admin/withdrawal-requests/{id}/reject",
  tags: [openAPITags.admin.user_management.name],
  summary: "Reject withdrawal request",
  description: "Admin rejects withdrawal request with reason",
  request: {
    params: WithdrawalRequestIdSchema,
    body: {
      content: {
        "application/json": {
          schema: RejectWithdrawalRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Withdrawal request rejected successfully",
      content: {
        "application/json": {
          schema: WithdrawalRequestResponseSchema,
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
