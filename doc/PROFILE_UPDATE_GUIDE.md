# Profile Update Guide

## Overview

The profile update endpoint (`PATCH /api/user/me`) supports partial updates, allowing users to update only the fields they want to change without sending the entire profile object.

## Endpoint

```
PATCH /api/user/me
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Features

### Partial Updates
- Send only the fields you want to update
- All fields are optional
- Empty, null, or undefined fields are automatically ignored
- No need to send the entire profile object

### Role-Based Field Access

#### Customer Fields (All Users)
- `full_name` - User's full name (min 2 characters)
- `profile_img` - Profile image URL
- `cover_img` - Cover image URL
- `phone` - Phone number (min 10 characters)
- `address` - Physical address
- `bio` - User biography (max 500 characters)
- `description` - User description (max 2000 characters)
- `location` - Array of location IDs (MongoDB ObjectIds)
- `availability` - Availability date

#### Contractor-Only Fields
- `skills` - Array of skill strings
- `experience` - Array of experience IDs (MongoDB ObjectIds)
- `work_samples` - Array of work sample IDs (MongoDB ObjectIds)
- `certifications` - Array of certification IDs (MongoDB ObjectIds)
- `starting_budget` - Starting budget for projects (positive number)
- `hourly_charge` - Hourly rate (positive number)
- `category` - Array of category IDs (MongoDB ObjectIds)

### Protected Fields
These fields cannot be updated through this endpoint:
- `password` - Use password reset endpoint
- `role` - Cannot be changed
- `is_verified` - Admin only
- `isSuspend` - Admin only
- `refreshTokens` - System managed
- `otp` - System managed
- `_id`, `createdAt`, `updatedAt` - System managed

## Request Examples

### Update Single Field

```json
{
  "full_name": "John Doe"
}
```

### Update Multiple Fields

```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "bio": "Professional contractor with 10 years of experience"
}
```

### Update Contractor Profile

```json
{
  "full_name": "Jane Smith",
  "skills": ["plumbing", "electrical", "carpentry"],
  "hourly_charge": 75,
  "starting_budget": 50,
  "category": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "location": ["507f1f77bcf86cd799439013"]
}
```

### Update Images

```json
{
  "profile_img": "https://example.com/images/profile.jpg",
  "cover_img": "https://example.com/images/cover.jpg"
}
```

### Update Experience and Certifications

```json
{
  "experience": [
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439015"
  ],
  "certifications": [
    "507f1f77bcf86cd799439016"
  ],
  "work_samples": [
    "507f1f77bcf86cd799439017",
    "507f1f77bcf86cd799439018"
  ]
}
```

## Response

### Success Response (200)

```json
{
  "status": 200,
  "message": "Profile updated successfully",
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "role": "contractor",
    "full_name": "John Doe",
    "email": "john@example.com",
    "profile_img": "https://example.com/images/profile.jpg",
    "cover_img": "https://example.com/images/cover.jpg",
    "phone": "+1234567890",
    "address": "123 Main St",
    "bio": "Professional contractor",
    "description": "Experienced in...",
    "location": [...],
    "category": [...],
    "skills": ["plumbing", "electrical"],
    "experience": [...],
    "work_samples": [...],
    "certifications": [...],
    "starting_budget": 50,
    "hourly_charge": 75,
    "is_verified": true,
    "isSuspend": false,
    "total_jobs": 15,
    "review": {
      "total": 10,
      "average": 4.5,
      "ratingDistribution": {
        "5": 6,
        "4": 3,
        "3": 1,
        "2": 0,
        "1": 0
      },
      "reviews": [...]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  }
}
```

**Note**: 
- `review` field only appears for contractors
- `total_jobs` shows the aggregated count of jobs posted by the user
- All populated fields (location, category, experience, work_samples, certifications) are included

## Error Responses

### 400 - No Fields to Update

```json
{
  "status": 400,
  "message": "No fields to update",
  "success": false,
  "data": null
}
```

### 400 - Invalid IDs

```json
{
  "status": 400,
  "message": "One or more categories not found",
  "success": false,
  "data": null
}
```

### 400 - Validation Error

```json
{
  "status": 400,
  "message": "Validation failed",
  "success": false,
  "data": null,
  "errors": [
    {
      "path": "phone",
      "message": "Phone number must be at least 10 characters"
    }
  ]
}
```

### 401 - Unauthorized

```json
{
  "status": 401,
  "message": "Unauthorized",
  "success": false,
  "data": null
}
```

### 403 - Forbidden (Customer trying to update contractor fields)

```json
{
  "status": 403,
  "message": "Only contractors can update these fields",
  "success": false,
  "data": null
}
```

### 404 - User Not Found

```json
{
  "status": 404,
  "message": "User not found",
  "success": false,
  "data": null
}
```

### 500 - Internal Server Error

```json
{
  "status": 500,
  "message": "Failed to update profile",
  "success": false,
  "data": null
}
```

## Validation Rules

### Field Validations

- `full_name`: Minimum 2 characters
- `profile_img`: Must be a valid URL
- `cover_img`: Must be a valid URL
- `phone`: Minimum 10 characters
- `bio`: Maximum 500 characters
- `description`: Maximum 2000 characters
- `starting_budget`: Must be a positive number
- `hourly_charge`: Must be a positive number
- `skills`: Array of non-empty strings
- All ID fields: Must be valid MongoDB ObjectIds

### ID Validation

The service validates that all provided IDs exist in the database:
- `category` - Checks against Category collection
- `location` - Checks against Location collection
- `experience` - Checks against Experience collection
- `work_samples` - Checks against WorkSample collection
- `certifications` - Checks against Certification collection

## Implementation Details

### Optimizations

1. **Partial Updates**: Only fields present in the request are updated
2. **Empty Field Removal**: Automatically removes null, undefined, or empty string values
3. **Role-Based Filtering**: Automatically removes contractor-specific fields for customers
4. **Protected Field Filtering**: Automatically removes protected fields from update
5. **Shared Helper**: Uses `getUserProfile()` helper for consistent response format
6. **Parallel Validation**: Validates all IDs in parallel for better performance

### Security

1. **Authentication Required**: Must provide valid JWT access token
2. **User Context**: Can only update own profile (from token)
3. **Role Enforcement**: Customers cannot update contractor-specific fields
4. **Protected Fields**: System fields cannot be modified
5. **Input Validation**: All inputs validated with Zod schemas

### Database Operations

1. **Single Update Query**: Uses `findByIdAndUpdate` with `$set` operator
2. **Validation**: Runs Mongoose validators on update
3. **Optimized Fetch**: Uses shared `getUserProfile()` helper with:
   - Populated fields (location, category, experience, work_samples, certifications)
   - Review statistics (for contractors)
   - Job count aggregation
   - Parallel queries with `Promise.all()`

## Best Practices

### Client Implementation

1. **Send Only Changed Fields**: Don't send the entire profile object
2. **Handle Validation Errors**: Display field-specific error messages
3. **Update Local State**: Update local user state with response data
4. **Show Loading State**: Indicate update in progress
5. **Confirm Success**: Show success message to user

### Example Client Code (JavaScript)

```javascript
async function updateProfile(updates) {
  try {
    const response = await fetch('/api/user/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();

    if (result.success) {
      // Update local user state
      setUser(result.data);
      showSuccess('Profile updated successfully');
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError('Failed to update profile');
  }
}

// Usage examples
updateProfile({ full_name: 'John Doe' });
updateProfile({ phone: '+1234567890', bio: 'New bio' });
updateProfile({ 
  skills: ['plumbing', 'electrical'],
  hourly_charge: 75 
});
```

## Related Endpoints

- `GET /api/user/me` - Get current user profile
- `GET /api/user/:id` - Get user by ID
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

## Related Files

- `src/api/users/services/profile/edit-profile.service.ts` - Service implementation
- `src/api/users/users.validation.ts` - Validation schemas
- `src/api/users/users.openapi.ts` - OpenAPI documentation
- `src/helpers/user-profile.helper.ts` - Shared profile helper
- `src/db/models/user.model.ts` - User model
