import consola from "consola";
import type { Socket } from "socket.io";

/**
 * Socket.IO Logging Middleware
 * Logs all socket events, connections, and data for debugging
 *
 * @param socket - Socket.IO socket instance
 * @param next - Callback to continue connection
 */
export const loggerMiddleware = (
	socket: Socket,
	next: (err?: Error) => void,
) => {
	const socketId = socket.id;
	const userId = socket.data.userId || "unknown";
	const timestamp = new Date().toISOString();

	// Log connection attempt
	consola.info({
		message: "🔌 Socket Connection Attempt",
		timestamp,
		socketId,
		userId,
		handshake: {
			address: socket.handshake.address,
			headers: {
				userAgent: socket.handshake.headers["user-agent"],
				origin: socket.handshake.headers.origin,
				referer: socket.handshake.headers.referer,
			},
			query: socket.handshake.query,
			auth: socket.handshake.auth.token ? "***TOKEN_PROVIDED***" : "NO_TOKEN",
		},
	});

	// Log all incoming events using onAny
	socket.onAny((eventName, ...args) => {
		consola.info({
			message: `📨 Incoming Event: ${eventName}`,
			timestamp: new Date().toISOString(),
			socketId,
			userId: socket.data.userId || "unknown",
			eventName,
			data: sanitizeData(args),
		});
	});

	// Log all outgoing events (emit)
	const originalEmit = socket.emit;
	socket.emit = function (eventName: string, ...args: any[]) {
		consola.info({
			message: `📤 Outgoing Event: ${eventName}`,
			timestamp: new Date().toISOString(),
			socketId,
			userId: socket.data.userId || "unknown",
			eventName,
			data: sanitizeData(args),
		});

		return originalEmit.apply(this, [eventName, ...args]);
	};

	// Log disconnection
	socket.on("disconnect", (reason) => {
		const connectionTime = socket.handshake.issued
			? Date.now() - socket.handshake.issued
			: 0;

		consola.warn({
			message: "🔌 Socket Disconnected",
			timestamp: new Date().toISOString(),
			socketId,
			userId: socket.data.userId || "unknown",
			reason,
			duration: `${connectionTime}ms`,
		});
	});

	// Log errors
	socket.on("error", (error) => {
		consola.error({
			message: "❌ Socket Error",
			timestamp: new Date().toISOString(),
			socketId,
			userId: socket.data.userId || "unknown",
			error: {
				message: error.message,
				stack: error.stack,
			},
		});
	});

	next();
};

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, and other sensitive information
 *
 * @param data - Data to sanitize
 * @returns Sanitized data
 */
function sanitizeData(data: any): any {
	if (!data) return data;

	// Handle arrays
	if (Array.isArray(data)) {
		return data.map((item) => sanitizeData(item));
	}

	// Handle objects
	if (typeof data === "object" && data !== null) {
		const sanitized: any = {};

		for (const [key, value] of Object.entries(data)) {
			// Redact sensitive fields
			if (
				key.toLowerCase().includes("password") ||
				key.toLowerCase().includes("token") ||
				key.toLowerCase().includes("secret") ||
				key.toLowerCase().includes("auth")
			) {
				sanitized[key] = "***REDACTED***";
			} else {
				sanitized[key] = sanitizeData(value);
			}
		}

		return sanitized;
	}

	// Return primitive values as-is
	return data;
}

/**
 * Create a detailed logger for specific events
 * Use this for debugging specific event handlers
 *
 * @param eventName - Name of the event to log
 * @returns Logger function
 */
export const createEventLogger = (eventName: string) => {
	return (socket: Socket, data: any) => {
		consola.debug({
			message: `🔍 Event Handler: ${eventName}`,
			timestamp: new Date().toISOString(),
			socketId: socket.id,
			userId: socket.data.userId,
			eventName,
			data: sanitizeData(data),
			rooms: Array.from(socket.rooms),
		});
	};
};

/**
 * Log room operations
 * Tracks when users join/leave rooms
 *
 * @param socket - Socket instance
 */
export const logRoomOperations = (socket: Socket) => {
	const originalJoin = socket.join;
	const originalLeave = socket.leave;

	// Log room joins
	socket.join = function (rooms: string | string[]) {
		const roomList = Array.isArray(rooms) ? rooms : [rooms];

		consola.info({
			message: "🚪 User Joined Room(s)",
			timestamp: new Date().toISOString(),
			socketId: socket.id,
			userId: socket.data.userId,
			rooms: roomList,
			totalRooms: socket.rooms.size,
		});

		return originalJoin.call(this, rooms);
	};

	// Log room leaves
	socket.leave = function (room: string) {
		consola.info({
			message: "🚪 User Left Room",
			timestamp: new Date().toISOString(),
			socketId: socket.id,
			userId: socket.data.userId,
			room,
			remainingRooms: Array.from(socket.rooms),
		});

		return originalLeave.call(this, room);
	};
};

/**
 * Performance logger
 * Tracks event processing time
 *
 * @param socket - Socket instance
 */
export const logPerformance = (socket: Socket) => {
	const eventTimings = new Map<string, number>();

	socket.onAny((eventName) => {
		const startTime = Date.now();
		eventTimings.set(eventName, startTime);

		// Log when event processing completes
		setImmediate(() => {
			const duration = Date.now() - startTime;

			if (duration > 100) {
				// Log slow events (>100ms)
				consola.warn({
					message: `⚠️ Slow Event: ${eventName}`,
					timestamp: new Date().toISOString(),
					socketId: socket.id,
					userId: socket.data.userId,
					eventName,
					duration: `${duration}ms`,
				});
			}
		});
	});
};

/**
 * Connection statistics logger
 * Logs connection metrics periodically
 */
export const createConnectionStatsLogger = (io: any) => {
	setInterval(() => {
		const sockets = io.sockets.sockets;
		const connectedUsers = new Set<string>();

		for (const [, socket] of sockets) {
			if (socket.data.userId) {
				connectedUsers.add(socket.data.userId);
			}
		}

		consola.warn("📊 Connection Statistics");
		console.log({
			timestamp: new Date().toISOString(),
			totalSockets: sockets.size,
			uniqueUsers: connectedUsers.size,
			rooms: io.sockets.adapter.rooms.size,
		});
	}, 60000); // Log every minute
};
