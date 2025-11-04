import { verifyAccessToken } from "@/lib";
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

    // Verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
    //   userId: string;
    //   role: string;
    // };
    const decoded = verifyAccessToken(token);

    // Attach user data to socket for use in handlers
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;

    // Allow connection
    next();
    // oxlint-disable-next-line no-unused-vars
  } catch (_error) {
    console.log("🚀 ~ authMiddleware ~ _error:", _error)
    // Reject connection with error
    next(new Error("Invalid authentication token"));
  }
};
