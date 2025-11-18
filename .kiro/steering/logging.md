# Logging System

## Overview

JobSphere uses **Pino** for high-performance structured logging with automatic file rotation.

## Quick Reference

### Import

```typescript
import { logInfo, logError, logWarn, logDebug, logResponse } from "@/lib/pino";
```

### Usage

```typescript
// Info
logInfo("User registered", { userId: user._id, email: user.email });

// Error with context
logError("Payment failed", error, { orderId: order._id, userId: user._id });

// Warning
logWarn("Rate limit approaching", { userId, requestCount: 95 });

// Debug (development only)
logDebug("Cache hit", { key: "user:123" });

// Response logging (used internally by response handlers)
logResponse(200, "Success", { method: "POST", url: "/api/job" });
```

### Automatic Logging

- **HTTP Requests**: All requests are automatically logged with method, URL, status, response time, body, params, query, and user info
- **Response Handlers**: All `sendSuccess()`, `sendError()`, etc. automatically log with full context

## Best Practices

1. **Always include context**: userId, jobId, orderId, etc.
2. **Use appropriate log levels**: debug → info → warn → error
3. **Never log sensitive data**: passwords, tokens, credit cards
4. **Log before and after important operations**
5. **Include error objects**: `logError("message", error, context)`

## Log Files

```
logs/
├── app.log      # All logs (debug, info, warn, error)
└── error.log    # Errors only
```

## Configuration

Environment variables:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Documentation

See `doc/logging/` for complete documentation:

- `PINO_LOGGING_GUIDE.md` - Full guide
- `USAGE_EXAMPLES.md` - Code examples
- `README.md` - Quick start

## Migration from Winston

The API is compatible - just change the import:

```typescript
// Old
import { logError, logInfo } from "@/lib/logger";

// New
import { logError, logInfo } from "@/lib/pino";
```

## Features

✅ Fast (5x faster than Winston)  
✅ Automatic file rotation  
✅ Pretty console output (development)  
✅ Structured JSON (production)  
✅ Request tracking with full context  
✅ Error stack traces  
✅ Multiple log levels  
✅ Zero configuration needed
