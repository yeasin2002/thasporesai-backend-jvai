# Chat System

Real-time 1-on-1 messaging between customers and contractors using Socket.IO and REST API.

## Features

- Real-time messaging (Socket.IO)
- Message history (REST API)
- Typing indicators
- Online/offline status
- Read receipts
- JWT authentication

## Structure

```
src/api/chat/
├── socket/              # Socket.IO (real-time)
│   ├── handlers/        # Event handlers
│   └── middleware/      # Auth middleware
├── services/            # REST API services
├── chat.route.ts
├── chat.validation.ts
└── chat.openapi.ts

src/db/models/
├── conversation.model.ts
└── message.model.ts
```

## Quick Start

```bash
bun dev  # Socket.IO starts automatically
```

## REST API

```
GET    /api/chat/conversations              # List conversations
POST   /api/chat/conversations              # Create conversation
GET    /api/chat/conversations/:id/messages # Get messages
```

## Socket.IO Events

### Connect

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'JWT_TOKEN' }
});
```

### Send Message

```typescript
socket.emit('send_message', {
  conversationId: 'user1_user2',
  receiverId: 'user2',
  messageType: 'text',
  content: { text: 'Hello!' }
});
```

### Receive Message

```typescript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

### Other Events

```typescript
// Typing
socket.emit('typing_start', { conversationId });
socket.emit('typing_stop', { conversationId });
socket.on('user_typing', ({ userId, isTyping }) => {});

// Status
socket.on('user_online_status', ({ userId, isOnline }) => {});

// Read receipts
socket.emit('mark_as_read', { conversationId, messageIds: [] });
socket.on('message_read', ({ messageIds, readBy }) => {});
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

### Web

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token }
});

socket.on('new_message', (msg) => addToChat(msg));
```

## Testing

```bash
# REST API (use api-client/chat.http)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/chat/conversations

# Socket.IO (browser console)
const socket = io('http://localhost:4000', {
  auth: { token: 'YOUR_TOKEN' }
});
```

## Documentation

- API Docs: http://localhost:4000/api-docs
- Complete Reference: `CHAT_REFERENCE.md`

