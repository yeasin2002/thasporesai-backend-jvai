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


## Environments

| Environment | URL | Notes |
| :--- | :--- | :--- |
| **Production** | `http://server.myquickjobs.com` | Use this for the live app |
| **Local** | `http://localhost:4000` | For local development |
| **Network** | `http://172.17.144.1:4000` | For testing on devices in same network |

## Integration

To integrate, point your Socket.IO client to the **Production URL** (`http://server.myquickjobs.com`).

### Flutter

Use the `socket_io_client` package.

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;

  void connect(String token) {
    // initialize socket
    socket = IO.io('http://server.myquickjobs.com', IO.OptionBuilder()
      .setTransports(['websocket']) // for Flutter or Dart VM
      .setAuth({'token': token})    // optional: if your server requires auth
      .disableAutoConnect()         // disable auto-connection
      .build()
    );

    socket.connect();

    socket.onConnect((_) {
      print('Connected to chat server');
    });

    socket.onDisconnect((_) => print('Disconnected'));
    
    socket.on('new_message', (data) {
      print('New message received: $data');
      // Handle incoming message
    });
  }

  void sendMessage(String conversationId, String message) {
    socket.emit('send_message', {
      'conversationId': conversationId,
      'content': {'text': message},
      'messageType': 'text',
    });
  }
  
  void dispose() {
    socket.dispose();
  }
}
```

### Web

```typescript
import { io } from 'socket.io-client';

const socket = io('http://server.myquickjobs.com', {
  transports: ['websocket'],
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected to server');
});
```

## REST API Reference

Before connecting to the socket, you might want to fetch conversation history via REST API using the same base URL:

```
GET http://server.myquickjobs.com/api/chat/conversations
```

