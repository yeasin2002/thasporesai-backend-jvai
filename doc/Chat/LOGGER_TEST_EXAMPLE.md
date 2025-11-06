# Testing the Socket.IO Logger

## Quick Test

### 1. Enable Logging

Update your `.env`:
```env
SOCKET_DEBUG=true
NODE_ENV=development
```

### 2. Start Server

```bash
bun dev
```

You should see:
```
✅ Redis connected successfully
🚀 Server running on http://localhost:4000
💬 Socket.IO chat enabled
🔍 Socket.IO logging middleware enabled
```

### 3. Connect a Client

Use this HTML test file or your Flutter app:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Socket.IO Logger Test</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <h1>Socket.IO Logger Test</h1>
    <button onclick="connect()">Connect</button>
    <button onclick="sendMessage()">Send Message</button>
    <button onclick="joinRoom()">Join Room</button>
    <button onclick="disconnect()">Disconnect</button>
    
    <div id="logs"></div>

    <script>
        let socket;
        const token = "YOUR_JWT_TOKEN_HERE"; // Replace with real token

        function log(message) {
            const logs = document.getElementById('logs');
            logs.innerHTML += `<p>${new Date().toISOString()}: ${message}</p>`;
        }

        function connect() {
            socket = io('http://localhost:4000', {
                auth: { token: token }
            });

            socket.on('connect', () => {
                log('✅ Connected: ' + socket.id);
            });

            socket.on('new_message', (data) => {
                log('📨 New message: ' + JSON.stringify(data));
            });

            socket.on('error', (error) => {
                log('❌ Error: ' + error.message);
            });

            socket.on('disconnect', () => {
                log('🔌 Disconnected');
            });
        }

        function sendMessage() {
            if (!socket) {
                log('⚠️ Not connected');
                return;
            }

            socket.emit('send_message', {
                conversationId: 'test_conversation',
                receiverId: 'user456',
                messageType: 'text',
                content: { text: 'Test message from logger test' }
            });

            log('📤 Sent message');
        }

        function joinRoom() {
            if (!socket) {
                log('⚠️ Not connected');
                return;
            }

            socket.emit('join_conversation', {
                conversationId: 'test_conversation',
                userId: 'user123'
            });

            log('🚪 Joined room');
        }

        function disconnect() {
            if (socket) {
                socket.disconnect();
                log('👋 Disconnecting...');
            }
        }
    </script>
</body>
</html>
```

### 4. Check Server Logs

You should see logs like:

```
🔌 Socket Connection Attempt
{
  timestamp: '2025-11-05T10:30:00.000Z',
  socketId: 'abc123xyz',
  userId: 'user123',
  handshake: {
    address: '::1',
    headers: {
      userAgent: 'Mozilla/5.0...',
      origin: 'http://localhost:3000'
    },
    auth: '***TOKEN_PROVIDED***'
  }
}

✅ User connected: user123

🚪 User Joined Room(s)
{
  timestamp: '2025-11-05T10:30:10.000Z',
  socketId: 'abc123xyz',
  userId: 'user123',
  rooms: ['test_conversation'],
  totalRooms: 2
}

📨 Incoming Event: send_message
{
  timestamp: '2025-11-05T10:30:15.000Z',
  socketId: 'abc123xyz',
  userId: 'user123',
  eventName: 'send_message',
  data: [
    {
      conversationId: 'test_conversation',
      receiverId: 'user456',
      messageType: 'text',
      content: { text: 'Test message from logger test' }
    }
  ]
}

📤 Outgoing Event: new_message
{
  timestamp: '2025-11-05T10:30:15.100Z',
  socketId: 'abc123xyz',
  userId: 'user123',
  eventName: 'new_message',
  data: [ { /* message data */ } ]
}
```

## Expected Log Sequence

### On Connection
1. `🔌 Socket Connection Attempt` - Connection details
2. `✅ User connected: user123` - Successful connection

### On Join Room
1. `📨 Incoming Event: join_conversation` - Event received
2. `🚪 User Joined Room(s)` - Room operation

### On Send Message
1. `📨 Incoming Event: send_message` - Event received
2. `📤 Outgoing Event: new_message` - Message broadcast
3. `📤 Outgoing Event: message_delivered` - Delivery confirmation

### On Disconnect
1. `🔌 Socket Disconnected` - Disconnection details

### Every 60 Seconds
```
📊 Connection Statistics
{
  totalSockets: 1,
  uniqueUsers: 1,
  rooms: 2
}
```

## Testing Scenarios

### Test 1: Normal Flow
1. Connect → Should see connection logs
2. Join room → Should see room join logs
3. Send message → Should see event logs
4. Disconnect → Should see disconnect logs

### Test 2: Authentication Failure
1. Connect without token
2. Should see: `❌ Socket Error: Authentication token required`

### Test 3: Invalid Token
1. Connect with invalid token
2. Should see: `❌ Socket Error: Invalid authentication token`

### Test 4: Slow Event
1. Send a message that takes >100ms to process
2. Should see: `⚠️ Slow Event: send_message`

### Test 5: Data Sanitization
1. Send event with password field
2. Check logs - password should be `***REDACTED***`

## Verification Checklist

- [ ] Connection attempt logged with handshake details
- [ ] User ID appears in logs
- [ ] Incoming events logged with data
- [ ] Outgoing events logged with data
- [ ] Room operations logged
- [ ] Sensitive data redacted (tokens, passwords)
- [ ] Disconnection logged with reason
- [ ] Connection statistics logged every 60s
- [ ] Errors logged with stack traces
- [ ] Slow events highlighted (if any >100ms)

## Troubleshooting

### No logs appearing?

Check:
1. `SOCKET_DEBUG=true` in `.env`
2. Server restarted after changing `.env`
3. Logger middleware is imported in `index.ts`

### Logs too verbose?

Disable in production:
```env
NODE_ENV=production
SOCKET_DEBUG=false
```

### Want to log only specific events?

Comment out the logger middleware and use custom logging:

```typescript
import { createEventLogger } from "./middleware/logger.middleware";

socket.on("send_message", (data) => {
  const logger = createEventLogger("send_message");
  logger(socket, data);
  // ... handler code
});
```

## Performance Impact

The logger has minimal performance impact:

- **Development**: Negligible (logging is expected)
- **Production**: Disabled by default
- **When enabled**: ~1-2ms per event (acceptable for debugging)

## Next Steps

1. ✅ Test basic connection
2. ✅ Test event logging
3. ✅ Test room operations
4. ✅ Test error handling
5. ✅ Test data sanitization
6. ✅ Review logs for debugging
7. ✅ Disable in production

## Example Output

Here's what a complete session looks like:

```
[10:30:00] 🔌 Socket Connection Attempt
[10:30:00] ✅ User connected: user123
[10:30:05] 📨 Incoming Event: join_conversation
[10:30:05] 🚪 User Joined Room(s): ["user123_user456"]
[10:30:10] 📨 Incoming Event: send_message
[10:30:10] 📤 Outgoing Event: new_message
[10:30:10] 📤 Outgoing Event: message_delivered
[10:30:15] 📨 Incoming Event: typing_start
[10:30:15] 📤 Outgoing Event: user_typing
[10:30:20] 📨 Incoming Event: typing_stop
[10:30:20] 📤 Outgoing Event: user_typing
[10:31:00] 📊 Connection Statistics (totalSockets: 1, uniqueUsers: 1)
[10:35:00] 🔌 Socket Disconnected (reason: client namespace disconnect)
```

## Success Criteria

✅ All events are logged
✅ Sensitive data is redacted
✅ Performance is acceptable
✅ Logs are readable and useful
✅ Can debug issues using logs
✅ Can disable in production

---

**You're all set! Start testing and debugging with confidence! 🚀**
