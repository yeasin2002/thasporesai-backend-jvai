# Chat System Documentation

## Overview

This is a real-time bidirectional chat system built with Socket.IO for JobSphere. It enables Customers and Contractors to communicate in real-time through text messages and file sharing.

## Features

- ✅ Real-time messaging with Socket.IO
- ✅ One-to-one conversations
- ✅ Message history with pagination
- ✅ Typing indicators
- ✅ Online/offline status tracking
- ✅ Read receipts
- ✅ File sharing support (images, documents)
- ✅ JWT authentication for Socket.IO
- ✅ REST API for conversation management

## Architecture

```
src/api/chat/
├── socket/                          # Socket.IO implementation
│   ├── index.ts                     # Socket.IO server initialization
│   ├── middleware/
│   │   └── auth.middleware.ts       # JWT authentication for sockets
│   ├── handlers/
│   │   ├── chat.handler.ts          # Message sending/receiving
│   │   ├── typing.handler.ts        # Typing indicators
│   │   └── status.handler.ts        # Online/offline status
│   └── utils/
│       └── room.utils.ts            # Room management utilities
├── services/                        # REST API services
│   ├── get-conversations.service.ts # Get user conversations
│   ├── create-conversation.service.ts # Create new conversation
│   ├── get-messages.service.ts      # Get conversation messages
│   └── index.ts                     # Service exports
├── chat.route.ts                    # Express routes
├── chat.validation.ts               # Zod schemas
├── chat.openapi.ts                  # OpenAPI documentation
└── README.md                        # This file
```

## Database Models

### Conversation Model

- Stores conversation metadata between two users
- Tracks last message for preview
- Maintains unread count per user
- Optional link to job

### Message Model

- Individual messages in a conversation
- Supports text, image, and file types
- Tracks delivery status (sent, delivered, read)
- Stores file metadata for attachments

## Socket.IO Events

### Client → Server

#### `join_conversation`

Join a conversation room to receive messages

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
  messageType: "text", // or "image", "file"
  content: {
    text: "Hello!", // or fileUrl, fileName, fileSize for files
  },
});
```

#### `mark_as_read`

Mark messages as read

```typescript
socket.emit("mark_as_read", {
  conversationId: "user123_user456",
  messageIds: ["msg1", "msg2"],
});
```

#### `typing_start` / `typing_stop`

Show typing indicator

```typescript
socket.emit("typing_start", { conversationId: "user123_user456" });
socket.emit("typing_stop", { conversationId: "user123_user456" });
```

#### `get_online_status`

Check if user is online

```typescript
socket.emit("get_online_status", { userId: "user456" });
```

### Server → Client

#### `new_message`

Receive new message

```typescript
socket.on("new_message", (message) => {
  console.log("New message:", message);
});
```

#### `message_delivered`

Message delivery confirmation

```typescript
socket.on("message_delivered", ({ messageId }) => {
  console.log("Message delivered:", messageId);
});
```

#### `message_read`

Message read notification

```typescript
socket.on("message_read", ({ messageIds, readBy }) => {
  console.log("Messages read by:", readBy);
});
```

#### `user_typing`

Typing indicator

```typescript
socket.on("user_typing", ({ conversationId, userId, isTyping }) => {
  console.log(`User ${userId} is typing: ${isTyping}`);
});
```

#### `user_online_status`

Online/offline status

```typescript
socket.on("user_online_status", ({ userId, isOnline, lastSeen }) => {
  console.log(`User ${userId} online: ${isOnline}`);
});
```

#### `error`

Error handling

```typescript
socket.on("error", ({ message, code }) => {
  console.error("Socket error:", message);
});
```

## REST API Endpoints

### GET /api/chat/conversations

Get all conversations for authenticated user

**Response:**

```json
{
  "status": 200,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "_id": "conv123",
      "participants": [...],
      "lastMessage": {
        "text": "Hello",
        "senderId": "user123",
        "timestamp": "2025-10-26T10:00:00Z"
      },
      "unreadCount": 2,
      "otherUser": {
        "_id": "user456",
        "name": "John Doe",
        "avatar": "/uploads/avatar.jpg"
      }
    }
  ]
}
```

### POST /api/chat/conversations

Create new conversation

**Request:**

```json
{
  "participantId": "user456",
  "jobId": "job123" // optional
}
```

**Response:**

```json
{
  "status": 201,
  "message": "Conversation created successfully",
  "data": {
    "_id": "conv123",
    "participants": [...],
    ...
  }
}
```

### GET /api/chat/conversations/:id/messages

Get paginated messages

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

**Response:**

```json
{
  "status": 200,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [...],
    "hasMore": true,
    "totalPages": 5,
    "currentPage": 1
  }
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

    // Listen for events
    socket.on('connect', (_) => print('Connected'));
    socket.on('new_message', (data) => handleNewMessage(data));
    socket.on('user_typing', (data) => handleTyping(data));
    socket.on('user_online_status', (data) => handleStatus(data));
  }

  void sendMessage(String conversationId, String receiverId, String text) {
    socket.emit('send_message', {
      'conversationId': conversationId,
      'receiverId': receiverId,
      'messageType': 'text',
      'content': {'text': text}
    });
  }

  void joinConversation(String conversationId, String userId) {
    socket.emit('join_conversation', {
      'conversationId': conversationId,
      'userId': userId
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
  console.log("New message:", message);
});

socket.emit("send_message", {
  conversationId: "user123_user456",
  receiverId: "user456",
  messageType: "text",
  content: { text: "Hello!" },
});
```

## Authentication

All Socket.IO connections and REST API endpoints require JWT authentication.

**Socket.IO:**

```typescript
// Pass token in handshake auth
const socket = io("http://localhost:4000", {
  auth: { token: "your_jwt_token" },
});
```

**REST API:**

```
Authorization: Bearer your_jwt_token
```

## Environment Variables

Add to your `.env` file:

```env
# Socket.IO
CLIENT_URL=http://localhost:3000  # For CORS

# JWT (already configured)
JWT_SECRET=your_secret_key
```

## Testing

### Test Socket.IO Connection

```bash
# Install socket.io-client for testing
npm install -g socket.io-client

# Test connection (in Node.js REPL)
const io = require("socket.io-client");
const socket = io("http://localhost:4000", {
  auth: { token: "your_jwt_token" }
});

socket.on("connect", () => console.log("Connected!"));
```

### Test REST API

```bash
# Get conversations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/chat/conversations

# Create conversation
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"user456"}' \
  http://localhost:4000/api/chat/conversations

# Get messages
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/chat/conversations/CONV_ID/messages?page=1&limit=50"
```

## Scaling Considerations

For production with multiple server instances:

1. **Use Redis Adapter** for Socket.IO
2. **Store online status in Redis** instead of in-memory
3. **Implement message queues** for reliability
4. **Add rate limiting** to prevent abuse
5. **Optimize database queries** with proper indexes

## Security

- ✅ JWT authentication on all connections
- ✅ User authorization (can only access own conversations)
- ✅ Input validation with Zod schemas
- ✅ CORS configuration
- ⚠️ Add rate limiting in production
- ⚠️ Sanitize file uploads
- ⚠️ Implement message encryption for sensitive data

## Troubleshooting

### Socket not connecting

- Check JWT token is valid
- Verify CORS settings
- Check server is running on correct port

### Messages not appearing

- Ensure user has joined the conversation room
- Check database connection
- Verify conversation ID is correct

### Typing indicators not working

- Check socket connection is active
- Verify conversation ID matches
- Ensure events are properly emitted

## Future Enhancements

- [ ] Message encryption
- [ ] Voice messages
- [ ] Group chat support
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Search messages
- [ ] Push notifications integration
- [ ] Redis adapter for scaling
