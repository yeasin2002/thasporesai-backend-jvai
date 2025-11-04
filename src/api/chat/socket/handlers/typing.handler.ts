import type { Server, Socket } from "socket.io";

/**
 * Typing Indicator Event Handlers
 * Handles typing status events for real-time feedback
 *
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
export const registerTypingHandlers = (io: Server, socket: Socket) => {
	/**
	 * Event: typing_start
	 * User starts typing in a conversation
	 *
	 * Payload: { conversationId: string }
	 */
	socket.on("typing_start", ({ conversationId }) => {
		try {
			const userId = socket.data.userId;

			// Broadcast typing status to other users in the conversation
			// Don't send to the sender themselves
			socket.to(conversationId).emit("user_typing", {
				conversationId,
				userId,
				isTyping: true,
			});

			console.log(`⌨️  User ${userId} started typing in ${conversationId}`);
		} catch (error) {
			console.error("Error handling typing_start:", error);
		}
	});

	/**
	 * Event: typing_stop
	 * User stops typing in a conversation
	 *
	 * Payload: { conversationId: string }
	 */
	socket.on("typing_stop", ({ conversationId }) => {
		try {
			const userId = socket.data.userId;

			// Broadcast typing stopped status to other users
			socket.to(conversationId).emit("user_typing", {
				conversationId,
				userId,
				isTyping: false,
			});

			console.log(`⌨️  User ${userId} stopped typing in ${conversationId}`);
		} catch (error) {
			console.error("Error handling typing_stop:", error);
		}
	});
};
