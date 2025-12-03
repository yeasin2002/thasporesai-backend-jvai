# Category & Location API Documentation

Simple reference guide for frontend developers.

---

## Category API

**Base URL**: `/api/category`

### 1. Get All Categories

**GET** `/api/category`

**Query Parameters** (all optional):
- `search` - Search in name or description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response**:
```json
{
  "status": 200,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "plumber",
        "description": "Plumbing services",
        "icon": "/uploads/icon.png",
        "createdAt": "2025-12-03T10:00:00Z",
        "updatedAt": "2025-12-03T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 2. Get Category by ID

**GET** `/api/category/:id`

**Response**:
```json
{
  "status": 200,
  "message": "Category retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "plumber",
    "description": "Plumbing services",
    "icon": "/uploads/icon.png",
    "createdAt": "2025-12-03T10:00:00Z",
    "updatedAt": "2025-12-03T10:00:00Z"
  }
}
```

---

### 3. Create Category (Admin Only)

**POST** `/api/category`

**Headers**:
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body** (form-data):
- `name` (required) - Category name
- `description` (optional) - Category description
- `icon` (required) - Image file

**Response**:
```json
{
  "status": 201,
  "message": "Category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "plumber",
    "description": "Plumbing services",
    "icon": "/uploads/icon.png"
  }
}
```

---

### 4. Update Category (Admin Only)

**PUT** `/api/category/:id`

**Headers**:
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body** (form-data, all optional):
- `name` - Category name
- `description` - Category description
- `icon` - Image file

**Response**:
```json
{
  "status": 200,
  "message": "Category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "electrician",
    "description": "Electrical services",
    "icon": "/uploads/new-icon.png"
  }
}
```

---

### 5. Delete Category (Admin Only)

**DELETE** `/api/category/:id`

**Headers**:
- `Authorization: Bearer <access_token>`

**Response**:
```json
{
  "status": 200,
  "message": "Category deleted successfully",
  "data": null
}
```

---

## Location API

**Base URL**: `/api/location`

### 1. Get All Locations

**GET** `/api/location`

**Response**:
```json
{
  "status": 200,
  "message": "Locations retrieved successfully",
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "New York",
      "state": "NY",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "createdAt": "2025-12-03T10:00:00Z",
      "updatedAt": "2025-12-03T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Location by ID

**GET** `/api/location/:id`

**Response**:
```json
{
  "status": 200,
  "message": "Location retrieved successfully",
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "New York",
    "state": "NY",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "createdAt": "2025-12-03T10:00:00Z",
    "updatedAt": "2025-12-03T10:00:00Z"
  }
}
```

---

### 3. Create Location

**POST** `/api/location`

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "name": "Los Angeles",
  "state": "CA",
  "coordinates": {
    "lat": 34.0522,
    "lng": -118.2437
  }
}
```

**Response**:
```json
{
  "status": 201,
  "message": "Location created successfully",
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Los Angeles",
    "state": "CA",
    "coordinates": {
      "lat": 34.0522,
      "lng": -118.2437
    }
  }
}
```

---

### 4. Update Location

**PUT** `/api/location/:id`

**Headers**:
- `Content-Type: application/json`

**Body** (all fields optional):
```json
{
  "name": "Los Angeles City",
  "state": "CA",
  "coordinates": {
    "lat": 34.0522,
    "lng": -118.2437
  }
}
```

**Response**:
```json
{
  "status": 200,
  "message": "Location updated successfully",
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Los Angeles City",
    "state": "CA",
    "coordinates": {
      "lat": 34.0522,
      "lng": -118.2437
    }
  }
}
```

---

### 5. Delete Location

**DELETE** `/api/location/:id`

**Response**:
```json
{
  "status": 200,
  "message": "Location deleted successfully",
  "success": true,
  "data": null
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "status": 400,
  "message": "Error description",
  "data": null,
  "success": false
}
```

**Common Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

### Category API
- Public endpoints: GET all, GET by ID
- Admin-only endpoints: POST, PUT, DELETE
- Icon upload uses `multipart/form-data`
- Category names are stored in lowercase

### Location API
- All endpoints are currently public (no authentication required)
- Coordinates use standard lat/lng format
- State should be 2-letter state code (e.g., "NY", "CA")
