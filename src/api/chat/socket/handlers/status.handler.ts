import type { Server, Socket } from "socket.io";

/**
 * Online Status Tracking
 * In-memory storage for user online status
 * For production, consider using Redis for scalability
 */
const onlineUsers = new Map<
	string,
	{ socketId: string; lastSeen: Date; isOnline: boolean }
>();

/**
 * Online Status Event Handlers
 * Handles user online/offline status tracking
 *
 * @param io - Socket.IO server instance
 * @param socket - Individual socket connection
 */
export const registerStatusHandlers = (io: Server, socket: Socket) => {
	const userId = socket.data.userId;

	// Mark user as online when they connect
	onlineUsers.set(userId, {
		socketId: socket.id,
		lastSeen: new Date(),
		isOnline: true,
	});

	// Broadcast online status to all connected clients
	io.emit("user_online_status", {
		userId,
		isOnline: true,
		lastSeen: new Date(),
	});

	console.log(`🟢 User ${userId} is now online`);

	/**
	 * Event: get_online_status
	 * Check if a specific user is online
	 *
	 * Payload: { userId: string }
	 */
	socket.on("get_online_status", ({ userId: targetUserId }) => {
		const userStatus = onlineUsers.get(targetUserId);

		socket.emit("user_online_status", {
			userId: targetUserId,
			isOnline: userStatus?.isOnline || false,
			lastSeen: userStatus?.lastSeen || null,
		});
	});

	/**
	 * Event: disconnect
	 * Handle user disconnection and update status
	 */
	socket.on("disconnect", () => {
		// Update user status to offline
		const userStatus = onlineUsers.get(userId);
		if (userStatus) {
			userStatus.isOnline = false;
			userStatus.lastSeen = new Date();
			onlineUsers.set(userId, userStatus);
		}

		// Broadcast offline status to all connected clients
		io.emit("user_online_status", {
			userId,
			isOnline: false,
			lastSeen: new Date(),
		});

		console.log(`🔴 User ${userId} is now offline`);
	});
};

/**
 * Get all online users
 * Utility function for debugging or admin purposes
 *
 * @returns Array of online user IDs
 */
export const getOnlineUsers = (): string[] => {
	return Array.from(onlineUsers.entries())
		.filter(([_, status]) => status.isOnline)
		.map(([userId]) => userId);
};
