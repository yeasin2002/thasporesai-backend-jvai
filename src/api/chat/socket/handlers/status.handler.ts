import type { Server, Socket } from "socket.io";

/**
 * Online Status Tracking
 * In-memory storage for user online status
 * Supports multiple connections per user (e.g., mobile + web)
 * For production, consider using Redis for scalability
 */
const onlineUsers = new Map<
	string,
	{
		socketIds: Set<string>; // Multiple socket connections per user
		lastSeen: Date;
		isOnline: boolean;
	}
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

	// Get or create user status
	let userStatus = onlineUsers.get(userId);

	if (!userStatus) {
		// First connection for this user
		userStatus = {
			socketIds: new Set([socket.id]),
			lastSeen: new Date(),
			isOnline: true,
		};
		onlineUsers.set(userId, userStatus);

		// Broadcast online status to all connected clients
		io.emit("user_online_status", {
			userId,
			isOnline: true,
			lastSeen: new Date(),
		});

		console.log(`🟢 User ${userId} is now online (socket: ${socket.id})`);
	} else {
		// Additional connection for existing user
		userStatus.socketIds.add(socket.id);
		userStatus.isOnline = true;
		userStatus.lastSeen = new Date();
		onlineUsers.set(userId, userStatus);

		console.log(
			`🟢 User ${userId} connected additional socket (${socket.id}). Total: ${userStatus.socketIds.size}`,
		);
	}

	/**
	 * Event: get_online_status
	 * Check if a specific user is online
	 *
	 * Payload: { userId: string }
	 */
	socket.on("get_online_status", ({ userId: targetUserId }) => {
		const targetStatus = onlineUsers.get(targetUserId);

		// Check if user has any active connections
		const isOnline = targetStatus
			? targetStatus.isOnline && targetStatus.socketIds.size > 0
			: false;

		socket.emit("user_online_status", {
			userId: targetUserId,
			isOnline,
			lastSeen: targetStatus?.lastSeen || null,
			connectionCount: targetStatus?.socketIds.size || 0,
		});

		console.log(
			`📊 Status check: User ${targetUserId} is ${
				isOnline ? "online" : "offline"
			}`,
		);
	});

	/**
	 * Event: get_bulk_online_status
	 * Check online status for multiple users at once
	 *
	 * Payload: { userIds: string[] }
	 */
	socket.on("get_bulk_online_status", ({ userIds }: { userIds: string[] }) => {
		const statusMap: Record<
			string,
			{ isOnline: boolean; lastSeen: Date | null }
		> = {};

		for (const targetUserId of userIds) {
			const targetStatus = onlineUsers.get(targetUserId);
			const isOnline = targetStatus
				? targetStatus.isOnline && targetStatus.socketIds.size > 0
				: false;

			statusMap[targetUserId] = {
				isOnline,
				lastSeen: targetStatus?.lastSeen || null,
			};
		}

		socket.emit("bulk_online_status", statusMap);

		console.log(`📊 Bulk status check for ${userIds.length} users`);
	});

	/**
	 * Event: disconnect
	 * Handle user disconnection and update status
	 */
	socket.on("disconnect", () => {
		const userStatus = onlineUsers.get(userId);

		if (userStatus) {
			// Remove this socket from user's connections
			userStatus.socketIds.delete(socket.id);
			userStatus.lastSeen = new Date();

			// If user has no more active connections, mark as offline
			if (userStatus.socketIds.size === 0) {
				userStatus.isOnline = false;
				onlineUsers.set(userId, userStatus);

				// Broadcast offline status to all connected clients
				io.emit("user_online_status", {
					userId,
					isOnline: false,
					lastSeen: new Date(),
				});

				console.log(
					`🔴 User ${userId} is now offline (all sockets disconnected)`,
				);
			} else {
				// User still has other active connections
				onlineUsers.set(userId, userStatus);
				console.log(
					`🟡 User ${userId} disconnected one socket. Remaining: ${userStatus.socketIds.size}`,
				);
			}
		}
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
