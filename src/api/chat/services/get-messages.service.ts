import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { RequestHandler } from "express";

/**
 * Get Messages Service
 * Retrieves paginated messages for a specific conversation
 *
 * @route GET /api/chat/conversations/:id/messages
 * @access Private (requires authentication)
 */
export const getMessages: RequestHandler = async (req, res) => {
	try {
		const { id: conversationId } = req.params;
		const userId = req.user?.id;

		// Get pagination parameters from query
		const page = parseInt(req.query.page as string, 10) || 1;
		const limit = parseInt(req.query.limit as string, 10) || 50;
		const skip = (page - 1) * limit;

		if (!userId) {
			return sendError(res, 401, "Unauthorized");
		}

		// Check if conversation exists and user is a participant
		const conversation = await db.conversation.findById(conversationId);

		if (!conversation) {
			return sendError(res, 404, "Conversation not found");
		}

		// Verify user is a participant in this conversation
		const isParticipant = conversation.participants.some(
			(p) => p.toString() === userId,
		);

		if (!isParticipant) {
			return sendError(
				res,
				403,
				"You are not a participant in this conversation",
			);
		}

		// Get total message count for pagination
		const totalMessages = await db.message.countDocuments({ conversationId });
		const totalPages = Math.ceil(totalMessages / limit);

		// Fetch messages with pagination (newest first)
		const messages = await db.message
			.find({ conversationId })
			.populate("senderId", "name avatar") // Populate sender details
			.sort({ timestamp: -1 }) // Sort by newest first
			.skip(skip)
			.limit(limit)
			.lean();

		// Reverse to show oldest first in the response
		messages.reverse();

		return sendSuccess(res, 200, "Messages retrieved successfully", {
			messages,
			hasMore: page < totalPages,
			totalPages,
			currentPage: page,
		});
	} catch (error) {
		console.error("Error getting messages:", error);
		return sendError(res, 500, "Internal Server Error");
	}
};
