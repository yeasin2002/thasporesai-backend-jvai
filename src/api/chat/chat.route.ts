import { requireAuth, validateBody } from "@/middleware";
import express, { type Router } from "express";
import "./chat.openapi";
import { CreateConversationSchema } from "./chat.validation";
import { createConversation, getConversations, getMessages } from "./services";

/**
 * Chat Routes
 * REST API endpoints for chat functionality
 *
 * All routes require authentication
 */
export const chat: Router = express.Router();

// ============================================
// Conversation Routes
// ============================================

/**
 * GET /api/chat/conversations
 * Get all conversations for authenticated user
 */
chat.get("/conversations", requireAuth, getConversations);

/**
 * POST /api/chat/conversations
 * Create a new conversation with another user
 */
chat.post(
	"/conversations",
	requireAuth,
	validateBody(CreateConversationSchema),
	createConversation,
);

/**
 * GET /api/chat/conversations/:id/messages
 * Get paginated messages for a specific conversation
 */
chat.get("/conversations/:id/messages", requireAuth, getMessages);
