import { logger, verifyAccessToken } from "@/lib";
import consola from "consola";
import type { Socket } from "socket.io";

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token before allowing socket connection
 *
 * @param socket - Socket.IO socket instance
 * @param next - Callback to continue or reject connection
 */
export const authMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // Extract token from handshake auth or headers
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    // Check if token exists
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = verifyAccessToken(token);
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;

    next();
  } catch (error) {
    consola.error("🚀 socket auth~ error:", error);
    logger.error("Invalid authentication token", error);
    next(new Error("Invalid authentication token"));
  }
};
