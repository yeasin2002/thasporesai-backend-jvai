/**
 * Room Utility Functions
 * Helper functions for managing Socket.IO rooms
 */

/**
 * Create a deterministic room ID for 1-on-1 chat
 * Always returns the same room ID regardless of who initiates the chat
 *
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Room ID string
 *
 * @example
 * createRoomId("user123", "user456") // Returns: "user123_user456"
 * createRoomId("user456", "user123") // Returns: "user123_user456" (same)
 */
export const createRoomId = (userId1: string, userId2: string): string => {
	// Sort user IDs alphabetically to ensure consistency
	return [userId1, userId2].sort().join("_");
};

/**
 * Extract user IDs from a room ID
 *
 * @param roomId - Room ID string
 * @returns Array of two user IDs
 *
 * @example
 * getRoomParticipants("user123_user456") // Returns: ["user123", "user456"]
 */
export const getRoomParticipants = (roomId: string): string[] => {
	return roomId.split("_");
};
