# ImageKit Integration - Backend Guide

## Overview

JobSphere uses ImageKit for image uploads, providing CDN delivery, automatic optimization, and URL-based transformations.

---

## Setup

### 1. Get ImageKit Credentials

1. Sign up at [imagekit.io](https://imagekit.io/)
2. Go to **Dashboard** → **Developer** → **API Keys**
3. Copy:
   - Public Key
   - Private Key
   - URL Endpoint

### 2. Configure Environment

Add to `.env`:

```env
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### 3. Restart Server

```bash
bun dev
```

Verify logs show: `✓ ImageKit initialized`

---

## API Endpoints

### 1. Server-Side Upload

Upload image through backend to ImageKit.

**Endpoint:**

```
POST /api/common/upload
```

**Headers:**

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**

```
image: File (max 5MB, JPEG/PNG/GIF/WebP/SVG)
```

**Response (200):**

```json
{
  "status": 200,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://ik.imagekit.io/your_id/uploads/image.jpg",
    "fileId": "abc123xyz",
    "filename": "image.jpg",
    "originalName": "photo.jpg",
    "size": 245678,
    "mimetype": "image/jpeg",
    "thumbnailUrl": "https://ik.imagekit.io/.../thumbnail.jpg",
    "filePath": "/uploads/image.jpg"
  }
}
```

**Errors:**

- `400` - No file provided or invalid file type
- `401` - Unauthorized
- `500` - Upload failed

**Test:**

```bash
curl -X POST http://localhost:4000/api/common/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg"
```

---

### 2. Get Authentication Parameters

Get temporary auth for client-side direct upload to ImageKit.

**Endpoint:**

```
GET /api/common/upload/auth
```

**Headers:**

```
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "status": 200,
  "message": "Authentication parameters generated successfully",
  "data": {
    "token": "unique_token_here",
    "expire": 1234567890,
    "signature": "signature_hash",
    "publicKey": "public_key_xxx",
    "urlEndpoint": "https://ik.imagekit.io/your_id"
  }
}
```

**Errors:**

- `401` - Unauthorized
- `500` - Failed to generate auth parameters

**Test:**

```bash
curl -X GET http://localhost:4000/api/common/upload/auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Implementation Details

### File Storage

- **Storage**: Memory (multer.memoryStorage)
- **Max Size**: 5MB (configurable in `src/lib/multer.ts`)
- **Allowed Types**: JPEG, PNG, GIF, WebP, SVG

### File Validation

Validation happens in `src/lib/multer.ts`:

- MIME type check
- File extension check
- Size limit enforcement

### Upload Flow

**Server-Side Upload:**

```
Client → Backend → ImageKit CDN
```

**Client-Side Upload:**

```
Client → Backend (auth) → Client → ImageKit CDN (direct)
```

### Configuration Files

- `src/lib/imagekit.ts` - ImageKit client
- `src/lib/Env.ts` - Environment variables
- `src/lib/multer.ts` - File upload config
- `src/api/common/img-upload/upload-image.service.ts` - Upload services
- `src/api/common/common.route.ts` - Routes

---

## Image Transformations

ImageKit provides URL-based transformations. No need to store multiple sizes.

### Examples

```javascript
// Original
https://ik.imagekit.io/your_id/uploads/image.jpg

// Thumbnail (200x200)
https://ik.imagekit.io/your_id/uploads/image.jpg?tr=w-200,h-200

// Optimized (auto WebP, quality 80)
https://ik.imagekit.io/your_id/uploads/image.jpg?tr=q-80,f-auto

// Responsive
https://ik.imagekit.io/your_id/uploads/image.jpg?tr=w-800,f-auto
```

### Common Parameters

| Parameter     | Description        | Example        |
| ------------- | ------------------ | -------------- |
| `w-{width}`   | Set width          | `?tr=w-400`    |
| `h-{height}`  | Set height         | `?tr=h-300`    |
| `q-{quality}` | Quality (1-100)    | `?tr=q-80`     |
| `f-auto`      | Auto format (WebP) | `?tr=f-auto`   |
| `c-at_max`    | Crop to fit        | `?tr=c-at_max` |

[Full docs](https://docs.imagekit.io/features/image-transformations)

---

## Security

1. **Authentication**: All endpoints require valid JWT
2. **File Validation**: Type and size checked server-side
3. **Token Expiration**: Auth tokens expire after 1 hour
4. **Private Key**: Never exposed to frontend

---

## Troubleshooting

### "ImageKit configuration missing"

**Solution:**

- Verify all three env vars are set
- Restart server
- Check for typos

### "Failed to upload image"

**Check:**

- ImageKit credentials valid
- File size < 5MB
- File type allowed
- Server logs for details

### "Authentication parameters failed"

**Solution:**

- Verify private key
- Regenerate keys in ImageKit dashboard
- Update `.env` and restart

---

## Best Practices

1. **Use client-side upload** for large files (reduces server load)
2. **Apply transformations in URLs** (don't store multiple sizes)
3. **Use auto format** (`?tr=f-auto`) for WebP support
4. **Organize with folders** in ImageKit dashboard
5. **Add tags** for easier management

---

## Migration from Local Storage

### Changes

**Before:**

```json
{ "url": "http://localhost:4000/uploads/image.jpg" }
```

**After:**

```json
{
  "url": "https://ik.imagekit.io/your_id/uploads/image.jpg",
  "fileId": "abc123",
  "thumbnailUrl": "https://ik.imagekit.io/.../thumbnail.jpg"
}
```

### Steps

1. Add ImageKit credentials to `.env`
2. Restart server
3. Test endpoints
4. Update frontend to handle new response format
5. Old files in `/uploads` remain (can be deleted)

---

## Resources

- [ImageKit Dashboard](https://imagekit.io/dashboard)
- [ImageKit API Docs](https://docs.imagekit.io/api-reference/api-introduction)
- [Transformation Docs](https://docs.imagekit.io/features/image-transformations)
- [Frontend Guide](./IMAGEKIT_FRONTEND_GUIDE.md)
