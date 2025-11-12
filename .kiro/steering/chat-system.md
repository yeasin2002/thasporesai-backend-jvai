---
inclusion: always
---

# Real-Time Chat System

## Overview

JobSphere implements a real-time bidirectional chat system using **Socket.IO** for communication between Customers and Contractors. The system supports both Flutter mobile app and web clients with database persistence.

## Technology Choice: Socket.IO

**Why Socket.IO over raw WebSocket:**

- Auto-reconnection with exponential backoff
- Built-in room management for 1-on-1 chats
- Event-based architecture (cleaner than message parsing)
- Excellent Flutter support via `socket_io_client` package
- Fallback mechanisms for restrictive networks
- Broadcasting and acknowledgment support

## Architecture

### Connection Flow

```
Client (Flutter/Web) → Socket.IO Client → Express Server → Socket.IO Server → Database
                                              ↓
                                         Room Management
                                              ↓
                                    Broadcast to Participants
```

### Room Naming Convention

Use deterministic room IDs for 1-on-1 chats:

```typescript
// Always sort user IDs to ensure same room ID regardless of who initiates
const roomId = [userId1, userId2].sort().join("_");
// Example: "user123_user456"
```

## Database Schema

### Conversation Model

```typescript
{
  _id: ObjectId,
  participants: [ObjectId], // [customerId, contractorId]
  lastMessage: {
    text: String,
    senderId: ObjectId,
    timestamp: Date
  },
  unreadCount: {
    [userId: string]: Number // Track unread per user
  },
  jobId: ObjectId, // Optional: link to specific job
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```typescript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  messageType: 'text' | 'image' | 'file' | 'offer',
  content: {
    text?: String,
    fileUrl?: String,
    fileName?: String,
    fileSize?: Number,
    offerAmount?: Number,
    offerDetails?: Object
  },
  status: 'sent' | 'delivered' | 'read',
  timestamp: Date,
  createdAt: Date
}
```

### User Online Status

Store in-memory (Redis recommended for production):

```typescript
{
  userId: string,
  socketId: string,
  isOnline: boolean,
  lastSeen: Date
}
```

## Socket.IO Events

### Client → Server Events

#### `authenticate`

Authenticate user on connection

```typescript
socket.emit("authenticate", { token: "jwt_token" });
```

#### `join_conversation`

Join a specific conversation room

```typescript
socket.emit("join_conversation", {
  conversationId: "user123_user456",
  userId: "user123",
});
```

#### `send_message`

Send a new message

```typescript
socket.emit("send_message", {
  conversationId: "user123_user456",
  receiverId: "user456",
  messageType: "text",
  content: { text: "Hello!" },
});
```

#### `typing_start` / `typing_stop`

Typing indicators

```typescript
socket.emit("typing_start", { conversationId: "user123_user456" });
socket.emit("typing_stop", { conversationId: "user123_user456" });
```

#### `mark_as_read`

Mark messages as read

```typescript
socket.emit("mark_as_read", {
  conversationId: "user123_user456",
  messageIds: ["msg1", "msg2"],
});
```

#### `get_online_status`

Check if user is online

```typescript
socket.emit("get_online_status", { userId: "user456" });
```

### Server → Client Events

#### `authenticated`

Confirm successful authentication

```typescript
socket.emit("authenticated", { userId: "user123", success: true });
```

#### `new_message`

Receive new message

```typescript
socket.emit("new_message", {
  _id: "msg123",
  conversationId: "user123_user456",
  senderId: "user456",
  messageType: "text",
  content: { text: "Hello!" },
  timestamp: "2025-10-26T10:30:00Z",
});
```

#### `message_delivered`

Confirm message delivery

```typescript
socket.emit("message_delivered", { messageId: "msg123" });
```

#### `message_read`

Notify sender that message was read

```typescript
socket.emit("message_read", {
  messageIds: ["msg1", "msg2"],
  readBy: "user456",
});
```

#### `user_typing`

Show typing indicator

```typescript
socket.emit("user_typing", {
  conversationId: "user123_user456",
  userId: "user456",
  isTyping: true,
});
```

#### `user_online_status`

User online/offline status

```typescript
socket.emit("user_online_status", {
  userId: "user456",
  isOnline: true,
  lastSeen: "2025-10-26T10:30:00Z",
});
```

#### `error`

Error handling

```typescript
socket.emit("error", {
  message: "Authentication failed",
  code: "AUTH_ERROR",
});
```

## Server Implementation

### File Structure

```
src/
├── app.ts
├── api/
│   ├── chat/
│   │   ├── chat.route.ts          # REST API endpoints
│   │   ├── chat.validation.ts     # Zod schemas
│   │   ├── chat.openapi.ts        # OpenAPI docs
│   │   ├── services/              # REST service handlers
│   │   │   ├── index.ts
│   │   │   ├── create-conversation.service.ts
│   │   │   ├── get-conversations.service.ts
│   │   │   └── get-messages.service.ts
│   │   └── socket/                # Socket.IO implementation
│   │       ├── index.ts           # Socket.IO server setup
│   │       ├── handlers/
│   │       │   ├── chat.handler.ts   # Chat messages
│   │       │   ├── typing.handler.ts # Typing indicators
│   │       │   └── status.handler.ts # Online status
│   │       ├── middleware/
│   │       │   ├── auth.middleware.ts   # Socket auth
│   │       │   └── logger.middleware.ts # Socket logging
│   │       └── utils/
│   │           └── room.utils.ts     # Room management
```

### Setup Socket.IO Server

```typescript
// src/api/chat/socket/index.ts
import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { authMiddleware } from "./middleware/auth.middleware";
import { loggerMiddleware, logRoomOperations, logPerformance } from "./middleware/logger.middleware";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { registerStatusHandlers } from "./handlers/status.handler";
import consola from "consola";

export const initializeSocketIO = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(authMiddleware);

  // Logging middleware (development only)
  if (process.env.NODE_ENV !== "production" || process.env.SOCKET_DEBUG === "true") {
    io.use(loggerMiddleware);
  }

  // Connection handler
  io.on("connection", (socket) => {
    consola.info(`✅ User '${socket.data.email}' connected with ID: ${socket.data.userId}`);

    // Enable logging
    logRoomOperations(socket);
    logPerformance(socket);

    // Register event handlers
    registerChatHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerStatusHandlers(io, socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      consola.warn(`❌ User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
};
```

### Authentication Middleware

```typescript
// src/api/chat/socket/middleware/auth.middleware.ts
import type { Socket } from "socket.io";
import { verifyAccessToken } from "@/lib/jwt";

export const authMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify token using existing JWT utility
    const decoded = verifyAccessToken(token);

    // Attach user data to socket
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;
    socket.data.role = decoded.role;

    next();
  } catch (error) {
    next(new Error("Invalid authentication token"));
  }
};
```

### Logger Middleware

```typescript
// src/api/chat/socket/middleware/logger.middleware.ts
import consola from "consola";
import type { Socket } from "socket.io";

export const loggerMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  consola.info(`🔌 Socket connection attempt from: ${socket.data.email || "unknown"}`);
  next();
};

export const logRoomOperations = (socket: Socket) => {
  socket.on("join_conversation", (data) => {
    consola.info(`📥 User ${socket.data.userId} joining room: ${data.conversationId}`);
  });
};

export const logPerformance = (socket: Socket) => {
  const startTime = Date.now();
  socket.on("disconnect", () => {
    const duration = Date.now() - startTime;
    consola.info(`⏱️ Connection duration: ${duration}ms`);
  });
};
```

### Chat Handler Example

```typescript
// src/api/chat/socket/handlers/chat.handler.ts
import type { Server, Socket } from "socket.io";
import { db } from "@/db";
import { createRoomId } from "../utils/room.utils";
import consola from "consola";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  // Join conversation room
  socket.on("join_conversation", async ({ conversationId, userId }) => {
    socket.join(conversationId);
    consola.info(`User ${userId} joined conversation ${conversationId}`);
  });

  // Send message
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, receiverId, messageType, content } = data;
      const senderId = socket.data.userId;

      // Save message to database
      const message = await db.message.create({
        conversationId,
        senderId,
        receiverId,
        messageType,
        content,
        status: "sent",
        timestamp: new Date(),
      });

      // Update conversation's last message
      await db.conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          text: content.text || "File",
          senderId,
          timestamp: new Date(),
        },
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      });

      // Broadcast to conversation room
      io.to(conversationId).emit("new_message", message);

      // Send delivery confirmation to sender
      socket.emit("message_delivered", { messageId: message._id });
      
      consola.success(`Message sent in conversation ${conversationId}`);
    } catch (error) {
      consola.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark messages as read
  socket.on("mark_as_read", async ({ conversationId, messageIds }) => {
    try {
      const userId = socket.data.userId;

      // Update message status
      await db.message.updateMany(
        { _id: { $in: messageIds }, receiverId: userId },
        { status: "read" }
      );

      // Reset unread count
      await db.conversation.findByIdAndUpdate(conversationId, {
        [`unreadCount.${userId}`]: 0,
      });

      // Notify sender
      io.to(conversationId).emit("message_read", {
        messageIds,
        readBy: userId,
      });
    } catch (error) {
      consola.error("Error marking as read:", error);
      socket.emit("error", { message: "Failed to mark as read" });
    }
  });
};
```

## REST API Endpoints

Complement Socket.IO with REST endpoints for initial data loading:

### `GET /api/chat/conversations`

Get user's conversation list

**Implementation**: `src/api/chat/services/get-conversations.service.ts`

```typescript
Response: {
  status: 200,
  message: "Conversations retrieved successfully",
  data: [
    {
      _id: "conv123",
      participants: [...],
      lastMessage: { text: "Hello", timestamp: "..." },
      unreadCount: 2,
      otherUser: { _id, name, avatar, isOnline }
    }
  ]
}
```

### `GET /api/chat/conversations/:id/messages`

Get conversation message history (paginated)

**Implementation**: `src/api/chat/services/get-messages.service.ts`

```typescript
Query: { page: 1, limit: 50 }
Response: {
  status: 200,
  message: "Messages retrieved successfully",
  data: {
    messages: [...],
    hasMore: true,
    totalPages: 5
  }
}
```

### `POST /api/chat/conversations`

Create new conversation

**Implementation**: `src/api/chat/services/create-conversation.service.ts`

```typescript
Body: { participantId: "user456", jobId?: "job123" }
Response: {
  status: 201,
  message: "Conversation created successfully",
  data: { conversationId: "user123_user456" }
}
```

### `POST /api/common/upload`

Upload file for chat (images, documents)

**Implementation**: `src/api/common/img-upload/upload-image.service.ts`

```typescript
Body: FormData with file
Response: {
  status: 200,
  message: "File uploaded successfully",
  data: { fileUrl: "/uploads/file123.jpg" }
}
```

## Client Integration

### Flutter (socket_io_client)

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;

  void connect(String token) {
    socket = IO.io('http://localhost:4000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token}
    });

    socket.connect();

    socket.on('connect', (_) => print('Connected'));
    socket.on('new_message', (data) => handleNewMessage(data));
    socket.on('user_typing', (data) => handleTyping(data));
  }

  void sendMessage(String conversationId, String receiverId, String text) {
    socket.emit('send_message', {
      'conversationId': conversationId,
      'receiverId': receiverId,
      'messageType': 'text',
      'content': {'text': text}
    });
  }

  void disconnect() {
    socket.disconnect();
  }
}
```

### Web (socket.io-client)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: localStorage.getItem("token") },
});

socket.on("connect", () => console.log("Connected"));

socket.on("new_message", (message) => {
  // Update UI with new message
});

socket.emit("send_message", {
  conversationId: "user123_user456",
  receiverId: "user456",
  messageType: "text",
  content: { text: "Hello!" },
});
```

## Performance Optimization

### 1. Use Redis Adapter (Production)

For horizontal scaling across multiple servers:

```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 2. Message Pagination

Load messages in chunks (50 per page) to reduce initial load time.

### 3. Lazy Loading

Only load conversation details when user opens a chat.

### 4. Debounce Typing Indicators

Limit typing event emissions to once per 2-3 seconds.

### 5. Connection Pooling

Reuse database connections, don't create new ones per message.

## Security Considerations

1. **Authentication**: Verify JWT on every socket connection
2. **Authorization**: Ensure users can only join their own conversations
3. **Rate Limiting**: Limit messages per user per minute
4. **Input Validation**: Sanitize all message content
5. **File Upload**: Validate file types and sizes
6. **XSS Prevention**: Escape HTML in messages on client side

## Environment Variables

```env
# Socket.IO
SOCKET_PORT=4000
CLIENT_URL=http://localhost:3000

# Redis (optional, for scaling)
REDIS_URL=redis://localhost:6379

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

## Dependencies

```json
{
  "socket.io": "^4.7.0",
  "@socket.io/redis-adapter": "^8.3.0",
  "redis": "^4.6.0"
}
```

## Testing

### Test Socket Events

Use `socket.io-client` in tests:

```typescript
import { io } from "socket.io-client";

describe("Chat System", () => {
  let clientSocket;

  beforeAll((done) => {
    clientSocket = io("http://localhost:4000", {
      auth: { token: "test_token" },
    });
    clientSocket.on("connect", done);
  });

  afterAll(() => {
    clientSocket.close();
  });

  test("should send and receive message", (done) => {
    clientSocket.on("new_message", (message) => {
      expect(message.content.text).toBe("Test message");
      done();
    });

    clientSocket.emit("send_message", {
      conversationId: "test_conv",
      receiverId: "user2",
      messageType: "text",
      content: { text: "Test message" },
    });
  });
});
```

## Monitoring

Track these metrics:

- Active connections count
- Messages per second
- Average message delivery time
- Failed message rate
- Connection errors

Use tools like Socket.IO Admin UI or custom dashboards.
