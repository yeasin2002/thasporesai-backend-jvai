# Chat System Reference

## Overview

Real-time chat system for JobSphere using Socket.IO and REST API. Supports 1-on-1 messaging between customers and contractors with typing indicators, online status, and read receipts.

## Quick Start

```bash
bun dev  # Socket.IO auto-starts with server
```

## Architecture

```
Express REST API ←→ Socket.IO Server ←→ MongoDB
        ↓                    ↓
   Conversations        Real-time Events
   Messages             (send, typing, status)
```

## Database Models

**Conversation**

```typescript
{
  participants: [ObjectId, ObjectId],
  lastMessage: { text, senderId, timestamp },
  unreadCount: Map<userId, number>,
  jobId?: ObjectId
}
```

**Message**

```typescript
{
  conversationId: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  messageType: 'text' | 'image' | 'file',
  content: { text?, fileUrl?, fileName?, fileSize? },
  status: 'sent' | 'delivered' | 'read',
  timestamp: Date
}
```

## REST API

```
GET    /api/chat/conversations              # List conversations
POST   /api/chat/conversations              # Create conversation
GET    /api/chat/conversations/:id/messages # Get messages (paginated)
```

## Socket.IO Events

### Client → Server

```typescript
// Connect
io("http://localhost:4000", { auth: { token: "JWT_TOKEN" } });

// Join conversation
emit("join_conversation", { conversationId, userId });

// Send message
emit("send_message", {
  conversationId,
  receiverId,
  messageType: "text",
  content: { text: "Hello!" },
});

// Typing
emit("typing_start", { conversationId });
emit("typing_stop", { conversationId });

// Read receipts
emit("mark_as_read", { conversationId, messageIds: ["id1", "id2"] });

// Status
emit("get_online_status", { userId });

// Leave
emit("leave_conversation", { conversationId });
```

### Server → Client

```typescript
// Connection
on('connect', () => {})
on('authenticated', { userId, success })

// Messages
on('new_message', { _id, conversationId, senderId, content, ... })
on('message_delivered', { messageId })
on('message_read', { messageIds, readBy })

// Typing
on('user_typing', { conversationId, userId, isTyping })

// Status
on('user_online_status', { userId, isOnline, lastSeen })

// Errors
on('error', { message, code? })
on('disconnect', (reason) => {})
```

## Client Integration

### Flutter

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io('http://YOUR_IP:4000', {
  'auth': {'token': token},
  'transports': ['websocket']
});

socket.on('connect', (_) => print('Connected'));
socket.on('new_message', (data) => handleMessage(data));

socket.emit('send_message', {
  'conversationId': convId,
  'receiverId': userId,
  'messageType': 'text',
  'content': {'text': 'Hello'}
});
```

### Web (React/Vue/Angular)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token },
});

socket.on("new_message", (msg) => addToChat(msg));

socket.emit("send_message", {
  conversationId,
  receiverId,
  messageType: "text",
  content: { text: "Hello" },
});
```

## File Structure

```
src/api/chat/
├── socket/
│   ├── index.ts                    # Socket.IO server
│   ├── middleware/auth.middleware.ts
│   ├── handlers/
│   │   ├── chat.handler.ts
│   │   ├── typing.handler.ts
│   │   └── status.handler.ts
│   └── utils/room.utils.ts
├── services/
│   ├── get-conversations.service.ts
│   ├── create-conversation.service.ts
│   └── get-messages.service.ts
├── chat.route.ts
├── chat.validation.ts
└── chat.openapi.ts

src/db/models/
├── conversation.model.ts
└── message.model.ts
```

## Features

- ✅ Real-time messaging (Socket.IO)
- ✅ Message history (REST API with pagination)
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Read receipts
- ✅ JWT authentication
- ✅ Room-based architecture
- ✅ Multi-device support
- ✅ File/image messages (structure ready)

## Testing

**REST API**: Use `api-client/chat.http`

**Socket.IO**: Browser console

```javascript
const socket = io("http://localhost:4000", {
  auth: { token: "YOUR_JWT_TOKEN" },
});
socket.on("connect", () => console.log("Connected"));
```

## Configuration

```env
# Optional
CLIENT_URL=http://localhost:3000  # CORS
```

## Common Patterns

**Room ID**: Deterministic (sorted user IDs)

```typescript
// user123_user456 === user456_user123
const roomId = [userId1, userId2].sort().join("_");
```

**Message Flow**:

```
1. Client A sends message
2. Server saves to DB
3. Server emits to room
4. Client B receives message
5. Server confirms delivery to Client A
```

**Typing Indicator**:

```typescript
// Start typing
socket.emit("typing_start", { conversationId });

// Auto-stop after 3 seconds
setTimeout(() => {
  socket.emit("typing_stop", { conversationId });
}, 3000);
```

## Security

- JWT authentication on all connections
- Participant verification
- Input validation (Zod)
- CORS configuration
- Resource ownership checks

## Production Considerations

- Add Redis for online status (scalability)
- Add Redis adapter for Socket.IO (multi-server)
- Implement rate limiting
- Add message encryption (optional)
- Set up monitoring (connections, messages/sec, latency)

## API Documentation

- Swagger: http://localhost:4000/api-docs
- Scalar: http://localhost:4000/scaler

## Debugging

```bash
# Enable Socket.IO debug logs
set DEBUG=socket.io*        # Windows CMD
$env:DEBUG="socket.io*"     # PowerShell
export DEBUG=socket.io*     # Linux/Mac

bun dev
```

## Next Steps

1. Test REST endpoints
2. Test Socket.IO connection
3. Integrate with Flutter app
4. Add file upload for images
5. Implement push notifications (FCM)
6. Add message search
7. Consider Redis for scaling
