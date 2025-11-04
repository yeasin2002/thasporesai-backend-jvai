import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Validation Schemas for Chat API
 * Defines request/response schemas with OpenAPI documentation
 */

// ============================================
// Message Schemas
// ============================================

export const MessageContentSchema = z
	.object({
		text: z
			.string()
			.optional()
			.openapi({ description: "Text message content" }),
		fileUrl: z.string().optional().openapi({ description: "File URL" }),
		fileName: z.string().optional().openapi({ description: "File name" }),
		fileSize: z
			.number()
			.optional()
			.openapi({ description: "File size in bytes" }),
	})
	.openapi("MessageContent");

export const MessageSchema = z
	.object({
		_id: z.string().openapi({ description: "Message ID" }),
		conversationId: z.string().openapi({ description: "Conversation ID" }),
		senderId: z.string().openapi({ description: "Sender user ID" }),
		receiverId: z.string().openapi({ description: "Receiver user ID" }),
		messageType: z
			.enum(["text", "image", "file"])
			.openapi({ description: "Type of message" }),
		content: MessageContentSchema,
		status: z
			.enum(["sent", "delivered", "read"])
			.openapi({ description: "Message delivery status" }),
		timestamp: z.date().openapi({ description: "Message timestamp" }),
		createdAt: z.date().optional(),
	})
	.openapi("Message");

// ============================================
// Conversation Schemas
// ============================================

export const ConversationSchema = z
	.object({
		_id: z.string().openapi({ description: "Conversation ID" }),
		participants: z
			.array(z.string())
			.openapi({ description: "Array of participant user IDs" }),
		lastMessage: z
			.object({
				text: z.string(),
				senderId: z.string(),
				timestamp: z.date(),
			})
			.openapi({ description: "Last message preview" }),
		unreadCount: z.record(z.string(), z.number()).openapi({
			description: "Unread message count per user",
		}),
		jobId: z.string().optional().openapi({ description: "Related job ID" }),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),
	})
	.openapi("Conversation");

// ============================================
// Request Schemas
// ============================================

export const CreateConversationSchema = z
	.object({
		participantId: z
			.string()
			.min(1, "Participant ID is required")
			.openapi({ description: "ID of the other user in conversation" }),
		jobId: z
			.string()
			.optional()
			.openapi({ description: "Optional job ID to link conversation" }),
	})
	.openapi("CreateConversation");

export const GetMessagesQuerySchema = z
	.object({
		page: z
			.string()
			.optional()
			.default("1")
			.openapi({ description: "Page number for pagination" }),
		limit: z
			.string()
			.optional()
			.default("50")
			.openapi({ description: "Number of messages per page" }),
	})
	.openapi("GetMessagesQuery");

export const ConversationIdParamSchema = z
	.object({
		id: z.string().min(1).openapi({ description: "Conversation ID" }),
	})
	.openapi("ConversationIdParam");

// ============================================
// Response Schemas
// ============================================

export const ConversationResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: ConversationSchema.nullable(),
	})
	.openapi("ConversationResponse");

export const ConversationsResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.array(ConversationSchema),
	})
	.openapi("ConversationsResponse");

export const MessagesResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.object({
			messages: z.array(MessageSchema),
			hasMore: z.boolean(),
			totalPages: z.number(),
			currentPage: z.number(),
		}),
	})
	.openapi("MessagesResponse");

export const ErrorResponseSchema = z
	.object({
		status: z.number(),
		message: z.string(),
		data: z.null(),
	})
	.openapi("ErrorResponse");

// ============================================
// TypeScript Types
// ============================================

export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>;
