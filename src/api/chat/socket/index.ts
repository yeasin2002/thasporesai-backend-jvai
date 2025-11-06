import consola from "consola";
import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerStatusHandlers } from "./handlers/status.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { authMiddleware } from "./middleware/auth.middleware";
import {
  logPerformance,
  logRoomOperations,
  loggerMiddleware,
} from "./middleware/logger.middleware";

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
			//   credentials: true,
		},
		// Connection timeout settings
		pingTimeout: 60000, // 60 seconds
		pingInterval: 25000, // 25 seconds
	});

	// Apply authentication middleware to all connections
	io.use(authMiddleware);

	// Apply logging middleware (only in development or when DEBUG is enabled)
	if (
		process.env.NODE_ENV !== "production" ||
		process.env.SOCKET_DEBUG === "true"
	) {
    io.use(loggerMiddleware);
  }

	// Start connection statistics logger
	// createConnectionStatsLogger(io);

	// Handle new socket connections
	io.on("connection", (socket) => {
		consola.info(
			`✅ User '${socket.data.email}'  connected with ID : ${socket.data.userId}`,
		);

		// Enable room operation logging
		logRoomOperations(socket);

		// Enable performance logging
		logPerformance(socket);

		// Register all event handlers
		registerChatHandlers(io, socket);
		registerTypingHandlers(io, socket);
		registerStatusHandlers(io, socket);

		// Handle disconnection
		socket.on("disconnect", () => {
			consola.warn(`❌ User disconnected: ${socket.data.userId}`);
			// Update user online status to offline
			// This will be handled in status.handler.ts
		});
	});

	return io;
};
