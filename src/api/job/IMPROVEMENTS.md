# Job Module Improvements

## Overview

The job module has been significantly improved with better validation and error handling to prevent 500 errors and provide clear, actionable error messages to API consumers.

## Key Improvements

### 1. ObjectId Validation in Zod Schemas

**Problem**: When users provided invalid ObjectId strings (like "teck" instead of a 24-character hex string), MongoDB threw CastErrors that resulted in 500 Internal Server Errors.

**Solution**: Added custom ObjectId validation to all Zod schemas:

```typescript
// MongoDB ObjectId validation helper
const isValidObjectId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

// Zod schema for MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => isValidObjectId(val), {
  message: "Invalid ObjectId format. Must be a 24 character hex string",
});
```

**Impact**: Invalid ObjectIds are now caught at the validation layer (400 Bad Request) before reaching the database.

### 2. Centralized MongoDB Error Handler

**Created**: `src/helpers/mongodb-error-handler.ts`

**Features**:

- `handleMongoError()` - Centralized error handling for all MongoDB errors
- `isValidObjectId()` - Validate ObjectId format
- `validateObjectIds()` - Validate multiple ObjectIds at once
- `validatePagination()` - Sanitize and validate pagination parameters

**Benefits**:

- Consistent error responses across all endpoints
- Reduced code duplication
- Better error messages for users
- Handles CastError, ValidationError, and Duplicate Key errors

### 3. Updated All Service Files

All service files now use the centralized error handler:

**Before**:

```typescript
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    data: null,
  });
}
```

**After**:

```typescript
} catch (error) {
  return handleMongoError(error, res, "Failed to create job");
}
```

### 4. Improved Response Handling

All services now use helper functions from `@/helpers`:

- `sendSuccess()` - 200 OK responses
- `sendCreated()` - 201 Created responses
- `sendBadRequest()` - 400 Bad Request with validation errors
- `sendNotFound()` - 404 Not Found
- `sendForbidden()` - 403 Forbidden
- `sendInternalError()` - 500 Internal Server Error

### 5. Enhanced Validation

**Category and Location Validation**:

- Validates that referenced categories exist before creating/updating jobs
- Validates that referenced locations exist before creating/updating jobs
- Returns clear 400 errors instead of 500 errors

**Query Parameter Validation**:

- Search filters now validate ObjectId format
- Pagination parameters are sanitized and validated
- Invalid formats return 400 errors with helpful messages

## Error Response Examples

### Invalid ObjectId Format (400)

```json
{
  "status": 400,
  "message": "Invalid ObjectId format. Must be a 24 character hex string",
  "data": null,
  "success": false,
  "errors": [
    {
      "path": "category.0",
      "message": "Invalid ObjectId format. Must be a 24 character hex string"
    }
  ]
}
```

### Category Not Found (400)

```json
{
  "status": 400,
  "message": "One or more categories not found",
  "data": null,
  "success": false
}
```

### Job Not Found (404)

```json
{
  "status": 404,
  "message": "Job not found",
  "data": null,
  "success": false
}
```

### Unauthorized Access (403)

```json
{
  "status": 403,
  "message": "You can only update your own jobs",
  "data": null,
  "success": false
}
```

## Testing

To test the improvements, try these scenarios:

### 1. Invalid Category ID

```bash
POST /api/job
{
  "title": "Test Job",
  "category": ["teck"],  # Invalid ObjectId
  "description": "This is a test job description",
  "location": "valid_location_id",
  "budget": 100,
  "coverImg": "https://example.com/image.jpg"
}
```

**Expected**: 400 Bad Request with clear error message

### 2. Non-existent Category

```bash
POST /api/job
{
  "title": "Test Job",
  "category": ["507f1f77bcf86cd799439011"],  # Valid format but doesn't exist
  "description": "This is a test job description",
  "location": "valid_location_id",
  "budget": 100,
  "coverImg": "https://example.com/image.jpg"
}
```

**Expected**: 400 Bad Request - "One or more categories not found"

### 3. Invalid Job ID in URL

```bash
GET /api/job/invalid_id
```

**Expected**: 400 Bad Request - "Invalid ObjectId format"

## Migration Guide

If you're updating other modules to use this pattern:

1. **Update validation schemas** to use `objectIdSchema` for all MongoDB references
2. **Import helpers** from `@/helpers` instead of `@/helpers/response-handler`
3. **Replace error handling** with `handleMongoError(error, res, "Custom message")`
4. **Use response helpers** like `sendSuccess()`, `sendBadRequest()`, etc.
5. **Add existence checks** for referenced documents before creating/updating

## Benefits

✅ **Better UX**: Clear, actionable error messages
✅ **Easier Debugging**: Proper error codes and messages
✅ **Consistent API**: All endpoints follow the same error format
✅ **Reduced 500 Errors**: Validation catches issues before database operations
✅ **Maintainable Code**: Centralized error handling reduces duplication
✅ **Type Safety**: Full TypeScript support with proper types
