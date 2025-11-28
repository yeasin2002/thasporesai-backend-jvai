import { openAPITags } from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import {
  ConversationIdParamSchema,
  ConversationResponseSchema,
  ConversationsResponseSchema,
  CreateConversationSchema,
  ErrorResponseSchema,
  GetMessagesQuerySchema,
  MessagesResponseSchema,
} from "./chat.validation";

/**
 * OpenAPI Documentation for Chat API
 * Registers all chat endpoints with the OpenAPI registry
 */

// Register schemas
registry.register("CreateConversation", CreateConversationSchema);
registry.register("ConversationIdParam", ConversationIdParamSchema);
registry.register("GetMessagesQuery", GetMessagesQuerySchema);
registry.register("ConversationResponse", ConversationResponseSchema);
registry.register("ConversationsResponse", ConversationsResponseSchema);
registry.register("MessagesResponse", MessagesResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

// ============================================
// GET /api/chat/conversations
// Get all conversations for authenticated user
// ============================================
const chatBasePath = "/api/chat";
const chatPath = `${chatBasePath}/conversations`;

registry.registerPath({
  method: "get",
  path: chatPath,
  description: "Get all conversations for the authenticated user",
  summary: "Get user conversations",
  tags: [openAPITags.chat.name],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Conversations retrieved successfully",
      content: {
        "application/json": {
          schema: ConversationsResponseSchema,
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

// ============================================
// POST /api/chat/conversations
// Create a new conversation
// ============================================
registry.registerPath({
  method: "post",
  path: `${openAPITags.chat.basepath}/conversations`,
  description: "Create a new conversation with another user",
  summary: "Create conversation",
  tags: [openAPITags.chat.name],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateConversationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Conversation created successfully",
      content: {
        "application/json": {
          schema: ConversationResponseSchema,
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

// ============================================
// GET /api/chat/conversations/:id/messages
// Get messages for a specific conversation
// ============================================
registry.registerPath({
  method: "get",
  path: `${openAPITags.chat.basepath}/conversations/{id}/messages`,
  description: "Get paginated messages for a specific conversation",
  summary: "Get conversation messages",
  tags: [openAPITags.chat.name],
  security: [{ bearerAuth: [] }],
  request: {
    params: ConversationIdParamSchema,
    query: GetMessagesQuerySchema,
  },
  responses: {
    200: {
      description: "Messages retrieved successfully",
      content: {
        "application/json": {
          schema: MessagesResponseSchema,
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
    404: {
      description: "Conversation not found",
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
