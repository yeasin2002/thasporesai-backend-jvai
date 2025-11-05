import { db } from "@/db";
import consola from "consola";
import type { Server, Socket } from "socket.io";
// import { createRoomId } from "../utils/room.utils";

/**
 * Chat Event Handlers
 * Handles all chat-related Socket.IO events
 *
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
export const registerChatHandlers = (io: Server, socket: Socket) => {
  /**
   * Event: join_conversation
   * User joins a specific conversation room
   *
   * Payload: { conversationId: string, userId: string }
   */
  socket.on("join_conversation", async ({ conversationId, userId }) => {
    try {
      // Join the Socket.IO room
      socket.join(conversationId);
      console.log(`👥 User ${userId} joined conversation ${conversationId}`);

      // Optionally: Send confirmation to user
      socket.emit("joined_conversation", { conversationId });
    } catch (error) {
      console.error("Error joining conversation:", error);
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  /**
   * Event: send_message
   * User sends a new message in a conversation
   *
   * Payload: {
   *   conversationId: string,
   *   receiverId: string,
   *   messageType: "text" | "image" | "file",
   *   content: { text?: string, fileUrl?: string, fileName?: string, fileSize?: number }
   * }
   */
  socket.on("send_message", async (data) => {
    consola.info("🚀 ~ registerChatHandlers : ", data);
    try {
      const { conversationId, receiverId, messageType, content } = data;
      const senderId = socket.data.userId;

      // Validate required fields
      if (!conversationId || !receiverId || !messageType) {
        return socket.emit("error", { message: "Missing required fields" });
      }

      // Verify conversation exists and sender is a participant
      const conversation = await db.conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit("error", { message: "Conversation not found" });
      }

      // Check if sender is a participant
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === senderId
      );
      if (!isParticipant) {
        return socket.emit("error", {
          message: "You are not a participant in this conversation",
        });
      }

      // Create message in database
      const message = await db.message.create({
        conversationId,
        senderId,
        receiverId,
        messageType,
        content,
        status: "sent",
        timestamp: new Date(),
      });

      // Populate sender details for response
      const populatedMessage = await db.message
        .findById(message._id)
        .populate("senderId", "name avatar")
        .lean();

      // Update conversation's last message
      await db.conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          text: content.text || "File",
          senderId,
          timestamp: new Date(),
        },
        // Increment unread count for receiver
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      });

      // Broadcast message to all users in the conversation room
      io.to(conversationId).emit("new_message", populatedMessage);

      // Send delivery confirmation to sender
      socket.emit("message_delivered", { messageId: message._id });

      console.log(`💬 Message sent in conversation ${conversationId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  /**
   * Event: send_bulk_message
   * Contractor sends the same message to multiple customers
   * Useful for job-related announcements or updates
   *
   * Payload: {
   *   receiverIds: string[],
   *   messageType: "text" | "image" | "file",
   *   content: { text?: string, fileUrl?: string, fileName?: string, fileSize?: number },
   *   jobId?: string
   * }
   */
  socket.on("send_bulk_message", async (data) => {
    consola.info("🚀 ~ send_bulk_message : ", data);
    try {
      const { receiverIds, messageType, content, jobId } = data;
      const senderId = socket.data.userId;

      // Validate required fields
      if (
        !receiverIds ||
        !Array.isArray(receiverIds) ||
        receiverIds.length === 0
      ) {
        return socket.emit("error", {
          message: "receiverIds must be a non-empty array",
        });
      }

      if (!messageType || !content) {
        return socket.emit("error", { message: "Missing required fields" });
      }

      // Verify sender is a contractor
      const sender = await db.user.findById(senderId);
      if (!sender || sender.role !== "contractor") {
        return socket.emit("error", {
          message: "Only contractors can send bulk messages",
        });
      }

      const results = [];
      const errors = [];

      // Send message to each receiver
      for (const receiverId of receiverIds) {
        try {
          // Check if conversation exists, create if not
          let conversation = await db.conversation.findOne({
            participants: { $all: [senderId, receiverId] },
          });

          if (!conversation) {
            // Create new conversation
            conversation = await db.conversation.create({
              participants: [senderId, receiverId],
              lastMessage: {
                text: content.text || "File",
                senderId,
                timestamp: new Date(),
              },
              unreadCount: new Map([
                [senderId, 0],
                [receiverId, 1],
              ]),
              jobId: jobId || undefined,
            });
          }

          // Get conversation ID as string
          const conversationIdStr = conversation._id?.toString() || "";

          // Create message
          const message = await db.message.create({
            conversationId: conversationIdStr,
            senderId,
            receiverId,
            messageType,
            content,
            status: "sent",
            timestamp: new Date(),
          });

          // Get message ID as string
          const messageIdStr = message._id?.toString() || "";

          // Populate sender details
          const populatedMessage = await db.message
            .findById(messageIdStr)
            .populate("senderId", "name avatar")
            .lean();

          // Update conversation's last message
          await db.conversation.findByIdAndUpdate(conversationIdStr, {
            lastMessage: {
              text: content.text || "File",
              senderId,
              timestamp: new Date(),
            },
            $inc: { [`unreadCount.${receiverId}`]: 1 },
          });

          // Broadcast to conversation room
          io.to(conversationIdStr).emit("new_message", populatedMessage);

          results.push({
            receiverId,
            conversationId: conversationIdStr,
            messageId: messageIdStr,
            success: true,
          });

          console.log(
            `💬 Bulk message sent to ${receiverId} in conversation ${conversationIdStr}`
          );
        } catch (error) {
          console.error(`Error sending message to ${receiverId}:`, error);
          errors.push({
            receiverId,
            error: "Failed to send message",
          });
        }
      }

      // Send summary to sender
      socket.emit("bulk_message_sent", {
        totalSent: results.length,
        totalFailed: errors.length,
        results,
        errors,
      });

      console.log(
        `📨 Bulk message completed: ${results.length} sent, ${errors.length} failed`
      );
    } catch (error) {
      console.error("Error sending bulk message:", error);
      socket.emit("error", { message: "Failed to send bulk message" });
    }
  });

  /**
   * Event: mark_as_read
   * Mark messages as read by the receiver
   *
   * Payload: { conversationId: string, messageIds: string[] }
   */
  socket.on("mark_as_read", async ({ conversationId, messageIds }) => {
    try {
      const userId = socket.data.userId;

      // Update message status to "read"
      await db.message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: userId,
        },
        {
          status: "read",
        }
      );

      // Reset unread count for this user in the conversation
      await db.conversation.findByIdAndUpdate(conversationId, {
        [`unreadCount.${userId}`]: 0,
      });

      // Notify sender that messages were read
      io.to(conversationId).emit("message_read", {
        messageIds,
        readBy: userId,
      });

      console.log(
        `✅ Messages marked as read in conversation ${conversationId}`
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { message: "Failed to mark messages as read" });
    }
  });

  /**
   * Event: leave_conversation
   * User leaves a conversation room
   *
   * Payload: { conversationId: string }
   */
  socket.on("leave_conversation", ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(
      `👋 User ${socket.data.userId} left conversation ${conversationId}`
    );
  });
};
