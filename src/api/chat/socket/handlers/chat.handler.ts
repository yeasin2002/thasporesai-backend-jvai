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
