# Quick Fix Reference

## Issue 1: Online Status ✅ FIXED

### Problem
User online status not working when checking other users.

### Solution
Enhanced to support multiple connections per user.

### How to Use

#### Check Single User Status
```javascript
socket.emit("get_online_status", { userId: "user456" });

socket.on("user_online_status", (data) => {
  console.log(data);
  // {
  //   userId: "user456",
  //   isOnline: true,
  //   lastSeen: "2025-11-05T10:30:00.000Z",
  //   connectionCount: 2  // NEW!
  // }
});
```

#### Check Multiple Users (NEW!)
```javascript
socket.emit("get_bulk_online_status", {
  userIds: ["user1", "user2", "user3"]
});

socket.on("bulk_online_status", (statusMap) => {
  console.log(statusMap);
  // {
  //   "user1": { isOnline: true, lastSeen: "..." },
  //   "user2": { isOnline: false, lastSeen: "..." },
  //   "user3": { isOnline: true, lastSeen: "..." }
  // }
});
```

---

## Issue 2: Contractor Bulk Messaging ✅ IMPLEMENTED

### Problem
Contractors needed to send messages to multiple customers about a job.

### Solution
Added `send_bulk_message` event for contractors.

### How to Use

#### Send to Multiple Customers
```javascript
socket.emit("send_bulk_message", {
  receiverIds: ["customer1", "customer2", "customer3"],
  messageType: "text",
  content: {
    text: "Hi! I'm interested in your job posting."
  },
  jobId: "job123" // Optional
});

socket.on("bulk_message_sent", (result) => {
  console.log(`Sent: ${result.totalSent}`);
  console.log(`Failed: ${result.totalFailed}`);
  
  // Check results
  result.results.forEach(r => {
    console.log(`✅ Sent to ${r.receiverId}`);
  });
  
  // Check errors
  result.errors.forEach(e => {
    console.log(`❌ Failed to send to ${e.receiverId}: ${e.error}`);
  });
});
```

---

## New Events Summary

### 1. `get_bulk_online_status`
**Purpose:** Check multiple users' status at once
**Who can use:** Anyone
**Request:**
```javascript
{ userIds: ["user1", "user2", "user3"] }
```
**Response:** `bulk_online_status` event

### 2. `bulk_online_status`
**Purpose:** Response with status map
**Data:**
```javascript
{
  "user1": { isOnline: true, lastSeen: "..." },
  "user2": { isOnline: false, lastSeen: "..." }
}
```

### 3. `send_bulk_message`
**Purpose:** Send message to multiple users
**Who can use:** Contractors only
**Request:**
```javascript
{
  receiverIds: ["customer1", "customer2"],
  messageType: "text",
  content: { text: "Message" },
  jobId: "job123" // Optional
}
```
**Response:** `bulk_message_sent` event

### 4. `bulk_message_sent`
**Purpose:** Response with results
**Data:**
```javascript
{
  totalSent: 2,
  totalFailed: 0,
  results: [
    { receiverId: "customer1", conversationId: "...", messageId: "...", success: true },
    { receiverId: "customer2", conversationId: "...", messageId: "...", success: true }
  ],
  errors: []
}
```

---

## Testing

### Test Online Status
```bash
# Terminal 1: Start server
bun dev

# Terminal 2: Connect client 1
node test-client.js

# Terminal 3: Connect client 2 (same user)
node test-client.js

# Check connection count - should be 2
```

### Test Bulk Messaging
```bash
# Connect as contractor
const socket = io("http://localhost:4000", {
  auth: { token: "contractor_token" }
});

# Send bulk message
socket.emit("send_bulk_message", {
  receiverIds: ["customer1", "customer2"],
  messageType: "text",
  content: { text: "Test message" }
});

# Check results
socket.on("bulk_message_sent", (result) => {
  console.log("Results:", result);
});
```

---

## Common Issues

### Issue: "Only contractors can send bulk messages"
**Solution:** Make sure the user has `role: "contractor"` in the database.

### Issue: Bulk status returns all offline
**Solution:** Make sure users are actually connected. Check server logs for connection messages.

### Issue: Messages not delivered
**Solution:** 
1. Check if receiver IDs are valid
2. Check if conversations were created
3. Check server logs for errors

---

## Files Modified

1. `src/api/chat/socket/handlers/status.handler.ts` - Online status fixes
2. `src/api/chat/socket/handlers/chat.handler.ts` - Bulk messaging

---

## Documentation

- **Full Details:** `FIXES_AND_ENHANCEMENTS.md`
- **Resolution Summary:** `ISSUE_RESOLUTION_SUMMARY.md`
- **This Guide:** `QUICK_FIX_REFERENCE.md`

---

**Both issues are now resolved! ✅**
