import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerStatusHandlers } from "./handlers/status.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { authMiddleware } from "./middleware/auth.middleware";

/**
 * Initialize Socket.IO Server
 * Sets up real-time communication for chat system
 *
 * @param httpServer - HTTP server instance from Express
 * @returns Socket.IO server instance
 */
export const initializeSocketIO = (httpServer: HTTPServer) => {
	// Create Socket.IO server with CORS configuration
	const io = new Server(httpServer, {
		cors: {
			origin: process.env.CLIENT_URL || "*", // Allow all origins in development
			methods: ["GET", "POST"],
			credentials: true,
		},
		// Connection timeout settings
		pingTimeout: 60000, // 60 seconds
		pingInterval: 25000, // 25 seconds
	});

	// Apply authentication middleware to all connections
	io.use(authMiddleware);

	// Handle new socket connections
	io.on("connection", (socket) => {
		console.log(`✅ User connected: ${socket.data.userId}`);

		// Register all event handlers
		registerChatHandlers(io, socket);
		registerTypingHandlers(io, socket);
		registerStatusHandlers(io, socket);

		// Handle disconnection
		socket.on("disconnect", () => {
			console.log(`❌ User disconnected: ${socket.data.userId}`);
			// Update user online status to offline
			// This will be handled in status.handler.ts
		});
	});

	return io;
};
