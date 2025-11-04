import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { RequestHandler } from "express";
import type { CreateConversation } from "../chat.validation";

/**
 * Create Conversation Service
 * Creates a new conversation between two users or returns existing one
 *
 * @route POST /api/chat/conversations
 * @access Private (requires authentication)
 */
export const createConversation: RequestHandler<
	{},
	any,
	CreateConversation
> = async (req, res) => {
	try {
		const { participantId, jobId } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Validate that user is not trying to create conversation with themselves
		if (userId === participantId) {
			return sendError(res, 400, "Cannot create conversation with yourself");
		}

		// Check if participant exists
		const participantExists = await db.user.findById(participantId);
		if (!participantExists) {
			return sendError(res, 404, "Participant not found");
		}

		// Check if conversation already exists between these users
		const existingConversation = await db.conversation.findOne({
			participants: { $all: [userId, participantId] },
		});

		if (existingConversation) {
			// Return existing conversation
			return sendSuccess(
				res,
				200,
				"Conversation already exists",
				existingConversation,
			);
		}

		// Create new conversation
		const conversation = await db.conversation.create({
			participants: [userId, participantId],
			lastMessage: {
				text: "",
				senderId: userId,
				timestamp: new Date(),
			},
			unreadCount: new Map([
				[userId, 0],
				[participantId, 0],
			]),
			jobId: jobId || undefined,
		});

		// Populate participant details
		const populatedConversation = await db.conversation
			.findById(conversation._id)
			.populate("participants", "name avatar email role")
			.populate("jobId", "title budget")
			.lean();

		return sendSuccess(
			res,
			201,
			"Conversation created successfully",
			populatedConversation,
		);
	} catch (error) {
		console.error("Error creating conversation:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
