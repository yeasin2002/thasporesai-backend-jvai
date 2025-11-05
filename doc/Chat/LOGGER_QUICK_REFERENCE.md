# Socket.IO Logger - Quick Reference

## Enable Logging

Add to `.env`:

```env
SOCKET_DEBUG=true
NODE_ENV=development
```

## What Gets Logged

### ✅ Automatically Logged

- **Connections**: Every socket connection attempt
- **Disconnections**: When users disconnect
- **All Events**: Every incoming and outgoing event
- **Room Operations**: Join/leave room actions
- **Errors**: All socket errors with stack traces
- **Performance**: Events taking >100ms
- **Statistics**: Connection stats every minute

### 🔒 Automatically Redacted

Fields containing these keywords are redacted:

- `password`
- `token`
- `secret`
- `auth`

## Log Format

All logs include:

```json
{
  "message": "Event description",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "eventName": "send_message",
  "data": {
    /* sanitized data */
  }
}
```

## Quick Debugging

### Check if user is connected

```bash
grep "User connected: user123" logs.txt
```

### Find errors

```bash
grep "Socket Error" logs.txt
```

### Find slow events

```bash
grep "Slow Event" logs.txt
```

### Track specific event

```bash
grep "send_message" logs.txt
```

### Get user activity

```bash
grep "user123" logs.txt
```

## Common Issues

### User not receiving messages?

1. Check: `✅ User connected`
2. Check: `🚪 User Joined Room`
3. Check: `📤 Outgoing Event: new_message`

### Slow performance?

1. Look for: `⚠️ Slow Event`
2. Check duration
3. Optimize database queries

### Authentication failing?

1. Check: `❌ Socket Error: Invalid authentication token`
2. Verify token in handshake logs

## Disable in Production

```env
NODE_ENV=production
SOCKET_DEBUG=false
```

## Custom Logging

```typescript
import consola from "consola";

consola.info({
  message: "Custom log",
  socketId: socket.id,
  userId: socket.data.userId,
  customData: { key: "value" },
});
```

## Performance Tips

- Logs are minimal in production (unless SOCKET_DEBUG=true)
- Sensitive data is automatically redacted
- Slow events (>100ms) are highlighted
- Stats logged every 60 seconds

## Need More Help?

See full documentation: `LOGGING_AND_DEBUGGING.md`
