import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { RequestHandler } from "express";

/**
 * Get All Conversations Service
 * Retrieves all conversations for the authenticated user
 *
 * @route GET /api/chat/conversations
 * @access Private (requires authentication)
 */
export const getConversations: RequestHandler = async (req, res) => {
  try {
    // Get authenticated user ID from request (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Find all conversations where user is a participant
    const conversations = await db.conversation
      .find({
        participants: userId,
      })
      .populate("participants", "name avatar email role") // Populate user details
      .populate("jobId", "title budget") // Populate job details if linked
      .sort({ "lastMessage.timestamp": -1 }) // Sort by most recent message
      .lean();

    // Transform conversations to include other user details
    const transformedConversations = conversations.map((conv) => {
      // Find the other user in the conversation
      const otherUser = (conv.participants as any[]).find(
        (p) => p._id.toString() !== userId
      );

      // Get unread count for current user
      const unreadMap = conv.unreadCount;
      const unreadCount =
        unreadMap && typeof unreadMap === "object" && userId in unreadMap
          ? (unreadMap as Record<string, number>)[userId]
          : 0;

      return {
        ...conv,
        otherUser, // Add other user details for easy access
        unreadCount, // Unread count for current user
      };
    });

    return sendSuccess(
      res,
      200,
      "Conversations retrieved successfully",
      transformedConversations
    );
  } catch (error) {
    console.error("Error getting conversations:", error);
    return sendError(res, 500, "Internal Server Error");
  }
};
