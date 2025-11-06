import mongoose, { Schema, type Document } from "mongoose";

/**
 * Conversation Model
 * Represents a chat conversation between two users (Customer and Contractor)
 */

export interface IConversation extends Document {
	participants: mongoose.Types.ObjectId[]; // [customerId, contractorId]
	lastMessage: {
		text: string;
		senderId: mongoose.Types.ObjectId;
		timestamp: Date;
	};
	unreadCount: Map<string, number>; // Track unread messages per user
	jobId?: mongoose.Types.ObjectId; // Optional: link to specific job
	createdAt: Date;
	updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
	{
		// Two participants in the conversation
		participants: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		],

		// Last message details for conversation list preview
		lastMessage: {
			text: { type: String, default: "" },
			senderId: { type: Schema.Types.ObjectId, ref: "User" },
			timestamp: { type: Date, default: Date.now },
		},

		// Track unread message count for each participant
		// Key: userId, Value: unread count
		unreadCount: {
			type: Map,
			of: Number,
			default: {},
		},

		// Optional: Link conversation to a specific job
		jobId: {
			type: Schema.Types.ObjectId,
			ref: "Job",
		},
	},
	{
		timestamps: true,
	},
);

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ "lastMessage.timestamp": -1 });

export const Conversation = mongoose.model<IConversation>(
	"Conversation",
	conversationSchema,
);
