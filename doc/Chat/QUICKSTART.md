# Chat System Quick Start Guide

## 🚀 Getting Started

The chat system is now fully integrated into your JobSphere backend! Here's how to use it.

## ✅ What's Already Done

- ✅ Socket.IO server configured and running
- ✅ Database models created (Conversation & Message)
- ✅ REST API endpoints ready
- ✅ JWT authentication for Socket.IO
- ✅ Real-time event handlers
- ✅ OpenAPI documentation

## 📦 Installation Complete

Socket.IO has been added to your dependencies. No additional installation needed!

## 🔧 Configuration

Add to your `.env` file (optional):

```env
# Socket.IO CORS (optional - defaults to *)
CLIENT_URL=http://localhost:3000
```

## 🏃 Running the Server

Just start your server as usual:

```bash
bun dev
# or
bun dev:b
```

You'll see:

```
🚀 Server is running on port http://localhost:4000
💬 Socket.IO chat enabled
```

## 📡 Testing the Chat System

### 1. Test REST API Endpoints

Use the provided `api-client/chat.http` file or curl:

```bash
# Get your JWT token first (login)
TOKEN="your_jwt_token_here"

# Get all conversations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/chat/conversations

# Create a conversation
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"USER_ID_HERE"}' \
  http://localhost:4000/api/chat/conversations

# Get messages
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/chat/conversations/CONV_ID/messages?page=1&limit=50"
```

### 2. Test Socket.IO Connection

#### Using Browser Console (Quick Test)

```html
<!-- Add to your HTML -->
<script src="https://cdn.socket.io/4.7.0/socket.io.min.js"></script>
<script>
  const socket = io("http://localhost:4000", {
    auth: { token: "YOUR_JWT_TOKEN" },
  });

  socket.on("connect", () => {
    console.log("✅ Connected!", socket.id);
  });

  socket.on("new_message", (message) => {
    console.log("📩 New message:", message);
  });

  // Send a message
  socket.emit("send_message", {
    conversationId: "CONV_ID",
    receiverId: "USER_ID",
    messageType: "text",
    content: { text: "Hello from browser!" },
  });
</script>
```

#### Using Node.js (Testing Script)

Create `test-chat.js`:

```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:4000", {
  auth: { token: "YOUR_JWT_TOKEN" },
});

socket.on("connect", () => {
  console.log("✅ Connected!");

  // Join a conversation
  socket.emit("join_conversation", {
    conversationId: "user1_user2",
    userId: "user1",
  });
});

socket.on("new_message", (message) => {
  console.log("📩 New message:", message);
});

socket.on("error", (error) => {
  console.error("❌ Error:", error);
});
```

Run: `node test-chat.js`

## 🎯 Common Use Cases

### 1. Customer Initiates Chat with Contractor

```typescript
// 1. Create conversation (REST API)
POST /api/chat/conversations
{
  "participantId": "contractor_id",
  "jobId": "job_id" // optional
}

// 2. Connect to Socket.IO
const socket = io('http://localhost:4000', {
  auth: { token: customerToken }
});

// 3. Join conversation
socket.emit('join_conversation', {
  conversationId: 'customer_id_contractor_id',
  userId: 'customer_id'
});

// 4. Send message
socket.emit('send_message', {
  conversationId: 'customer_id_contractor_id',
  receiverId: 'contractor_id',
  messageType: 'text',
  content: { text: 'Hi, I need help with plumbing' }
});
```

### 2. Load Conversation History

```typescript
// Get all conversations
GET /api/chat/conversations

// Get messages for specific conversation
GET /api/chat/conversations/:id/messages?page=1&limit=50
```

### 3. Real-Time Features

```typescript
// Typing indicator
socket.emit("typing_start", { conversationId: "conv_id" });
// ... user stops typing
socket.emit("typing_stop", { conversationId: "conv_id" });

// Mark messages as read
socket.emit("mark_as_read", {
  conversationId: "conv_id",
  messageIds: ["msg1", "msg2"],
});

// Check online status
socket.emit("get_online_status", { userId: "user_id" });
```

## 📱 Flutter Integration

Add to `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.3
```

Create `chat_service.dart`:

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;

  void connect(String token) {
    socket = IO.io('http://YOUR_SERVER_IP:4000', {
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token}
    });

    socket.connect();

    socket.on('connect', (_) => print('✅ Connected'));
    socket.on('new_message', (data) => _handleNewMessage(data));
    socket.on('user_typing', (data) => _handleTyping(data));
  }

  void sendMessage(String conversationId, String receiverId, String text) {
    socket.emit('send_message', {
      'conversationId': conversationId,
      'receiverId': receiverId,
      'messageType': 'text',
      'content': {'text': text}
    });
  }

  void _handleNewMessage(dynamic data) {
    print('📩 New message: $data');
    // Update your UI
  }

  void _handleTyping(dynamic data) {
    print('⌨️ User typing: $data');
    // Show typing indicator
  }

  void disconnect() {
    socket.disconnect();
  }
}
```

## 🌐 Web Integration (React/Vue/Angular)

Install:

```bash
npm install socket.io-client
```

Create `chatService.ts`:

```typescript
import { io, Socket } from "socket.io-client";

class ChatService {
  private socket: Socket;

  connect(token: string) {
    this.socket = io("http://localhost:4000", {
      auth: { token },
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected");
    });

    this.socket.on("new_message", (message) => {
      console.log("📩 New message:", message);
      // Update your state/store
    });
  }

  sendMessage(conversationId: string, receiverId: string, text: string) {
    this.socket.emit("send_message", {
      conversationId,
      receiverId,
      messageType: "text",
      content: { text },
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export default new ChatService();
```

## 📚 API Documentation

View full API documentation at:

- **Swagger UI**: http://localhost:4000/swagger
- **Scalar UI**: http://localhost:4000/scaler

Look for the "Chat" section in the documentation.

## 🔍 Debugging

### Check if Socket.IO is running:

```bash
curl http://localhost:4000/socket.io/
# Should return: {"code":0,"message":"Transport unknown"}
```

### Enable Socket.IO debug logs:

```bash
# In your terminal before starting server
set DEBUG=socket.io*  # Windows CMD
$env:DEBUG="socket.io*"  # Windows PowerShell
export DEBUG=socket.io*  # Linux/Mac

bun dev
```

### Common Issues:

1. **"Authentication token required"**

   - Make sure you're passing the JWT token in the auth object
   - Token format: `{ auth: { token: 'your_jwt_token' } }`

2. **"Cannot connect to Socket.IO"**

   - Check CORS settings in `src/api/chat/socket/index.ts`
   - Verify server is running on correct port
   - Check firewall settings

3. **"Messages not appearing"**
   - Ensure you've joined the conversation room first
   - Check conversation ID is correct
   - Verify both users are in the same room

## 📖 Next Steps

1. **Test the REST API** using `api-client/chat.http`
2. **Test Socket.IO** using browser console or Node.js script
3. **Integrate with your Flutter app** using the provided code
4. **Add file upload** for images/documents (see README.md)
5. **Implement push notifications** for offline users

## 📝 File Structure

```
src/api/chat/
├── socket/                    # Socket.IO implementation
│   ├── index.ts              # Server setup
│   ├── middleware/           # Auth middleware
│   ├── handlers/             # Event handlers
│   └── utils/                # Helper functions
├── services/                 # REST API services
├── chat.route.ts            # Express routes
├── chat.validation.ts       # Zod schemas
├── chat.openapi.ts          # API documentation
├── README.md                # Full documentation
└── QUICKSTART.md            # This file
```

## 🎉 You're Ready!

The chat system is fully functional and ready to use. Start testing with the REST API, then integrate Socket.IO into your Flutter app!

For detailed documentation, see `README.md` in this folder.

## 💡 Tips

- Use conversation IDs in format: `userId1_userId2` (sorted alphabetically)
- Always join a conversation room before sending messages
- Implement reconnection logic in your client for better UX
- Add rate limiting in production to prevent abuse
- Consider using Redis for scaling to multiple servers

Happy coding! 🚀
