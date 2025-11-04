# Quick Start Guide - User Profile Sub-Modules

## Getting Started

### 1. Start the Server

```bash
bun dev
```

### 2. Login to Get Access Token

```http
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "contractor@example.com",
  "password": "your_password"
}
```

**Response**:

```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": { ... }
  },
  "success": true
}
```

Copy the `accessToken` for use in subsequent requests.

## Using the Modules

### Certifications

#### Create a Certification

```http
POST http://localhost:4000/api/user/certifications
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "AWS Certified Solutions Architect",
  "img": "https://example.com/aws-cert.jpg",
  "description": "Professional level AWS certification",
  "issue_date": "2024-01-15T00:00:00.000Z",
  "expiry_date": "2027-01-15T00:00:00.000Z",
  "issuing_organization": "Amazon Web Services"
}
```

#### Get All Certifications

```http
GET http://localhost:4000/api/user/certifications
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Update a Certification

```http
PUT http://localhost:4000/api/user/certifications/CERTIFICATION_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "AWS Certified Solutions Architect - Professional"
}
```

#### Delete a Certification

```http
DELETE http://localhost:4000/api/user/certifications/CERTIFICATION_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Experience

#### Create Experience

```http
POST http://localhost:4000/api/user/experience
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "company_name": "Tech Solutions Inc",
  "title": "Senior Full Stack Developer",
  "description": "Led development of microservices architecture",
  "start_date": "2020-06-01T00:00:00.000Z",
  "end_date": "2023-12-31T00:00:00.000Z"
}
```

#### Create Current Job (no end_date)

```http
POST http://localhost:4000/api/user/experience
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "company_name": "Innovative Startups LLC",
  "title": "Lead Software Engineer",
  "description": "Building scalable cloud-native applications",
  "start_date": "2024-01-15T00:00:00.000Z"
}
```

#### Get All Experiences

```http
GET http://localhost:4000/api/user/experience
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Work Samples

#### Create Work Sample

```http
POST http://localhost:4000/api/user/work-samples
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "E-commerce Platform",
  "img": "https://example.com/portfolio/ecommerce.jpg",
  "description": "Full-stack e-commerce platform built with MERN stack"
}
```

#### Get All Work Samples

```http
GET http://localhost:4000/api/user/work-samples
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## View Complete Profile

Get your complete profile with all sub-modules populated:

```http
GET http://localhost:4000/api/user/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response includes**:

- User basic info
- Categories
- Locations
- **Certifications** (populated)
- **Experience** (populated)
- **Work Samples** (populated)
- Review statistics (for contractors)
- Total jobs count

## API Documentation

View interactive API documentation:

- **Swagger UI**: http://localhost:4000/swagger
- **Scalar UI**: http://localhost:4000/scaler
- **JSON Spec**: http://localhost:4000/api-docs.json

## HTTP Test Files

Use the provided HTTP test files in `api-client/`:

1. Open `api-client/certifications.http`
2. Replace `YOUR_ACCESS_TOKEN_HERE` with your actual token
3. Click "Send Request" in your IDE (VS Code with REST Client extension)

## Common Errors

### 401 Unauthorized

- Missing or invalid access token
- Token expired (get a new one by logging in)

### 404 Not Found

- Record doesn't exist
- Record belongs to another user

### 400 Bad Request

- Validation error
- Check required fields and data types

## Tips

1. **Dates**: Use ISO 8601 format (`2024-01-15T00:00:00.000Z`)
2. **Images**: Upload images first, then use the URL
3. **Current Jobs**: Leave `end_date` null for ongoing employment
4. **Testing**: Use the HTTP files in `api-client/` for quick testing
5. **Documentation**: Check Swagger UI for detailed schema information

## Next Steps

1. Test all CRUD operations for each module
2. Verify data appears in profile (`GET /api/user/me`)
3. Check OpenAPI documentation
4. Integrate with your frontend application

## Support

For issues or questions:

- Check `doc/USER_PROFILE_MODULES.md` for detailed documentation
- Review `doc/IMPLEMENTATION_SUMMARY.md` for technical details
- Check the OpenAPI documentation at `/swagger`
