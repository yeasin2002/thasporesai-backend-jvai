import mongoose, { Schema, type Document } from "mongoose";

/**
 * Message Model
 * Represents individual messages in a conversation
 */

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  messageType: "text" | "image" | "file";
  content: {
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  status: "sent" | "delivered" | "read";
  timestamp: Date;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    // Reference to the conversation
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    // Sender of the message
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Receiver of the message
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of message
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },

    // Message content based on type
    content: {
      text: { type: String }, // For text messages
      fileUrl: { type: String }, // For image/file messages
      fileName: { type: String }, // Original file name
      fileSize: { type: Number }, // File size in bytes
    },

    // Message delivery status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    // Message timestamp
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1, status: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
