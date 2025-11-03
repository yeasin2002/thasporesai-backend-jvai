# Socket.IO Events Reference

Quick reference for all Socket.IO events in the chat system.

## Client → Server Events

### `join_conversation`
Join a conversation room to receive real-time messages.

**Payload:**
```typescript
{
  conversationId: string;  // e.g., "user123_user456"
  userId: string;          // Current user ID
}
```

**Example:**
```typescript
socket.emit('join_conversation', {
  conversationId: 'user123_user456',
  userId: 'user123'
});
```

---

### `send_message`
Send a new message in a conversation.

**Payload:**
```typescript
{
  conversationId: string;
  receiverId: string;
  messageType: 'text' | 'image' | 'file';
  content: {
    text?: string;        // For text messages
    fileUrl?: string;     // For image/file messages
    fileName?: string;    // Original file name
    fileSize?: number;    // File size in bytes
  };
}
```

**Examples:**

Text message:
```typescript
socket.emit('send_message', {
  conversationId: 'user123_user456',
  receiverId: 'user456',
  messageType: 'text',
  content: { text: 'Hello!' }
});
```

Image message:
```typescript
socket.emit('send_message', {
  conversationId: 'user123_user456',
  receiverId: 'user456',
  messageType: 'image',
  content: {
    fileUrl: '/uploads/chat/image123.jpg',
    fileName: 'photo.jpg',
    fileSize: 245678
  }
});
```

---

### `mark_as_read`
Mark messages as read.

**Payload:**
```typescript
{
  conversationId: string;
  messageIds: string[];  // Array of message IDs
}
```

**Example:**
```typescript
socket.emit('mark_as_read', {
  conversationId: 'user123_user456',
  messageIds: ['msg1', 'msg2', 'msg3']
});
```

---

### `typing_start`
Notify that user started typing.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Example:**
```typescript
socket.emit('typing_start', {
  conversationId: 'user123_user456'
});
```

---

### `typing_stop`
Notify that user stopped typing.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Example:**
```typescript
socket.emit('typing_stop', {
  conversationId: 'user123_user456'
});
```

---

### `get_online_status`
Check if a user is online.

**Payload:**
```typescript
{
  userId: string;
}
```

**Example:**
```typescript
socket.emit('get_online_status', {
  userId: 'user456'
});
```

---

### `leave_conversation`
Leave a conversation room.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Example:**
```typescript
socket.emit('leave_conversation', {
  conversationId: 'user123_user456'
});
```

---

## Server → Client Events

### `connect`
Emitted when socket successfully connects.

**Payload:** None

**Example:**
```typescript
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});
```

---

### `authenticated`
Emitted after successful authentication (optional).

**Payload:**
```typescript
{
  userId: string;
  success: boolean;
}
```

**Example:**
```typescript
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId);
});
```

---

### `joined_conversation`
Confirmation that user joined a conversation.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Example:**
```typescript
socket.on('joined_conversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});
```

---

### `new_message`
Receive a new message in a conversation.

**Payload:**
```typescript
{
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiverId: string;
  messageType: 'text' | 'image' | 'file';
  content: {
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}
```

**Example:**
```typescript
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // Add message to your UI
  addMessageToChat(message);
});
```

---

### `message_delivered`
Confirmation that message was delivered.

**Payload:**
```typescript
{
  messageId: string;
}
```

**Example:**
```typescript
socket.on('message_delivered', (data) => {
  console.log('Message delivered:', data.messageId);
  // Update message status in UI
  updateMessageStatus(data.messageId, 'delivered');
});
```

---

### `message_read`
Notification that messages were read.

**Payload:**
```typescript
{
  messageIds: string[];
  readBy: string;  // User ID who read the messages
}
```

**Example:**
```typescript
socket.on('message_read', (data) => {
  console.log('Messages read by:', data.readBy);
  // Update message status in UI
  data.messageIds.forEach(id => {
    updateMessageStatus(id, 'read');
  });
});
```

---

### `user_typing`
Notification that a user is typing.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: boolean;
}
```

**Example:**
```typescript
socket.on('user_typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

---

### `user_online_status`
User online/offline status update.

**Payload:**
```typescript
{
  userId: string;
  isOnline: boolean;
  lastSeen: Date | null;
}
```

**Example:**
```typescript
socket.on('user_online_status', (data) => {
  console.log(`User ${data.userId} is ${data.isOnline ? 'online' : 'offline'}`);
  updateUserStatus(data.userId, data.isOnline, data.lastSeen);
});
```

---

### `error`
Error notification.

**Payload:**
```typescript
{
  message: string;
  code?: string;
}
```

**Example:**
```typescript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  showErrorNotification(error.message);
});
```

---

### `disconnect`
Emitted when socket disconnects.

**Payload:** Reason string

**Example:**
```typescript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, try to reconnect
    socket.connect();
  }
});
```

---

## Complete Client Example

```typescript
import { io } from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:4000', {
  auth: { token: 'your_jwt_token' }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected');
  
  // Join conversation
  socket.emit('join_conversation', {
    conversationId: 'user123_user456',
    userId: 'user123'
  });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Message events
socket.on('new_message', (message) => {
  console.log('📩 New message:', message);
  displayMessage(message);
});

socket.on('message_delivered', ({ messageId }) => {
  console.log('✅ Delivered:', messageId);
  updateMessageStatus(messageId, 'delivered');
});

socket.on('message_read', ({ messageIds, readBy }) => {
  console.log('👁️ Read by:', readBy);
  messageIds.forEach(id => updateMessageStatus(id, 'read'));
});

// Typing events
socket.on('user_typing', ({ userId, isTyping }) => {
  if (isTyping) {
    showTypingIndicator(userId);
  } else {
    hideTypingIndicator(userId);
  }
});

// Status events
socket.on('user_online_status', ({ userId, isOnline, lastSeen }) => {
  updateUserStatus(userId, isOnline, lastSeen);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ Error:', error);
  showErrorNotification(error.message);
});

// Send message
function sendMessage(conversationId, receiverId, text) {
  socket.emit('send_message', {
    conversationId,
    receiverId,
    messageType: 'text',
    content: { text }
  });
}

// Typing indicators
let typingTimeout;
function handleTyping(conversationId) {
  socket.emit('typing_start', { conversationId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { conversationId });
  }, 3000);
}

// Mark as read
function markAsRead(conversationId, messageIds) {
  socket.emit('mark_as_read', {
    conversationId,
    messageIds
  });
}
```

---

## Event Flow Examples

### Sending a Message

```
Client A                    Server                    Client B
   |                          |                          |
   |--send_message----------->|                          |
   |                          |--new_message------------>|
   |<-message_delivered-------|                          |
   |                          |                          |
```

### Typing Indicator

```
Client A                    Server                    Client B
   |                          |                          |
   |--typing_start----------->|                          |
   |                          |--user_typing------------>|
   |                          |  (isTyping: true)        |
   |                          |                          |
   |--typing_stop------------>|                          |
   |                          |--user_typing------------>|
   |                          |  (isTyping: false)       |
```

### Read Receipt

```
Client A                    Server                    Client B
   |                          |                          |
   |                          |<-mark_as_read-----------|
   |<-message_read------------|                          |
   |  (update UI)             |                          |
```

---

## Testing Events

Use this simple HTML file to test events:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Chat Test</title>
  <script src="https://cdn.socket.io/4.7.0/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.IO Chat Test</h1>
  <div id="status">Disconnected</div>
  <div id="messages"></div>
  
  <input id="token" placeholder="JWT Token" />
  <button onclick="connect()">Connect</button>
  
  <input id="conversationId" placeholder="Conversation ID" />
  <button onclick="joinConversation()">Join</button>
  
  <input id="receiverId" placeholder="Receiver ID" />
  <input id="messageText" placeholder="Message" />
  <button onclick="sendMessage()">Send</button>

  <script>
    let socket;

    function connect() {
      const token = document.getElementById('token').value;
      socket = io('http://localhost:4000', {
        auth: { token }
      });

      socket.on('connect', () => {
        document.getElementById('status').textContent = 'Connected';
        console.log('Connected!');
      });

      socket.on('new_message', (message) => {
        const div = document.createElement('div');
        div.textContent = JSON.stringify(message);
        document.getElementById('messages').appendChild(div);
      });

      socket.on('error', (error) => {
        alert('Error: ' + error.message);
      });
    }

    function joinConversation() {
      const conversationId = document.getElementById('conversationId').value;
      socket.emit('join_conversation', {
        conversationId,
        userId: 'test_user'
      });
    }

    function sendMessage() {
      const conversationId = document.getElementById('conversationId').value;
      const receiverId = document.getElementById('receiverId').value;
      const text = document.getElementById('messageText').value;

      socket.emit('send_message', {
        conversationId,
        receiverId,
        messageType: 'text',
        content: { text }
      });
    }
  </script>
</body>
</html>
```

Save as `test-chat.html` and open in browser!
