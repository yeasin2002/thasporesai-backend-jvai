# Image Upload with ImageKit

This module provides two methods for uploading images using ImageKit:

1. **Server-side upload**: Upload through your backend server
2. **Client-side upload**: Direct upload from frontend to ImageKit

## Setup

### 1. Get ImageKit Credentials

1. Sign up at [ImageKit.io](https://imagekit.io/)
2. Go to Dashboard → Developer → API Keys
3. Copy your credentials:
   - Public Key
   - Private Key
   - URL Endpoint

### 2. Configure Environment Variables

Add to your `.env` file:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## API Endpoints

### 1. Server-Side Upload

**Endpoint**: `POST /api/common/upload`

**Authentication**: Required (Bearer token)

**Request**: Multipart form-data with `image` field

**Example (cURL)**:

```bash
curl -X POST http://localhost:4000/api/common/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Example (JavaScript/Fetch)**:

```javascript
const formData = new FormData();
formData.append("image", fileInput.files[0]);

const response = await fetch("http://localhost:4000/api/common/upload", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log(result.data.url); // ImageKit URL
```

**Response**:

```json
{
  "status": 200,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://ik.imagekit.io/your_id/uploads/image.jpg",
    "fileId": "abc123xyz",
    "filename": "image.jpg",
    "originalName": "my-photo.jpg",
    "size": 245678,
    "mimetype": "image/jpeg",
    "thumbnailUrl": "https://ik.imagekit.io/your_id/tr:n-media_library_thumbnail/uploads/image.jpg",
    "filePath": "/uploads/image.jpg"
  }
}
```

### 2. Client-Side Upload (Direct to ImageKit)

This is a two-step process:

#### Step 1: Get Authentication Parameters

**Endpoint**: `GET /api/common/upload/auth`

**Authentication**: Required (Bearer token)

**Example (JavaScript/Fetch)**:

```javascript
const response = await fetch("http://localhost:4000/api/common/upload/auth", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const authParams = await response.json();
```

**Response**:

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

#### Step 2: Upload Directly to ImageKit

**Example (JavaScript/Fetch)**:

```javascript
// Step 1: Get auth params from your server
const authResponse = await fetch(
  "http://localhost:4000/api/common/upload/auth",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
const authData = await authResponse.json();

// Step 2: Upload directly to ImageKit
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("fileName", fileInput.files[0].name);
formData.append("publicKey", authData.data.publicKey);
formData.append("signature", authData.data.signature);
formData.append("expire", authData.data.expire);
formData.append("token", authData.data.token);
formData.append("folder", "/uploads"); // Optional

const uploadResponse = await fetch(
  `${authData.data.urlEndpoint}/api/v1/files/upload`,
  {
    method: "POST",
    body: formData,
  }
);

const result = await uploadResponse.json();
console.log(result.url); // ImageKit URL
```

**Example (Flutter)**:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

// Step 1: Get auth params
Future<Map<String, dynamic>> getAuthParams(String token) async {
  final response = await http.get(
    Uri.parse('http://localhost:4000/api/common/upload/auth'),
    headers: {'Authorization': 'Bearer $token'},
  );
  return json.decode(response.body)['data'];
}

// Step 2: Upload to ImageKit
Future<String> uploadImage(File imageFile, String token) async {
  final authParams = await getAuthParams(token);

  var request = http.MultipartRequest(
    'POST',
    Uri.parse('${authParams['urlEndpoint']}/api/v1/files/upload'),
  );

  request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));
  request.fields['fileName'] = imageFile.path.split('/').last;
  request.fields['publicKey'] = authParams['publicKey'];
  request.fields['signature'] = authParams['signature'];
  request.fields['expire'] = authParams['expire'].toString();
  request.fields['token'] = authParams['token'];
  request.fields['folder'] = '/uploads';

  final response = await request.send();
  final responseData = await response.stream.bytesToString();
  final result = json.decode(responseData);

  return result['url'];
}
```

## When to Use Which Method?

### Server-Side Upload

**Use when:**

- You need server-side validation or processing
- You want to track uploads in your database
- You need to apply transformations before upload
- Security is critical (server validates everything)

**Pros:**

- Full control over upload process
- Easy to implement additional validation
- Can modify/process images before upload

**Cons:**

- Uses server bandwidth
- Slower for large files
- Server becomes bottleneck

### Client-Side Upload

**Use when:**

- You want faster uploads (direct to CDN)
- You want to reduce server load
- You're uploading large files
- You want better user experience

**Pros:**

- Faster uploads (direct to ImageKit)
- Reduces server bandwidth usage
- Better scalability
- Progress tracking on client

**Cons:**

- Less control over upload process
- Client needs to handle errors
- Requires two API calls (auth + upload)

## Image Transformations

ImageKit provides powerful URL-based transformations. Append transformation parameters to the URL:

```javascript
// Original URL
const originalUrl = "https://ik.imagekit.io/your_id/uploads/image.jpg";

// Resize to 300x300
const thumbnail = originalUrl + "?tr=w-300,h-300";

// Resize and crop
const cropped = originalUrl + "?tr=w-400,h-300,c-at_max";

// Multiple transformations
const optimized = originalUrl + "?tr=w-800,h-600,q-80,f-auto";
```

**Common transformations:**

- `w-{width}` - Width
- `h-{height}` - Height
- `q-{quality}` - Quality (1-100)
- `f-auto` - Auto format (WebP for supported browsers)
- `c-at_max` - Crop mode

[Full transformation docs](https://docs.imagekit.io/features/image-transformations)

## File Validation

Both methods validate:

- File type: JPEG, PNG, GIF, WebP, SVG
- File size: Max 5MB (configurable in `src/lib/multer.ts`)

## Error Handling

**Common errors:**

1. **No file provided** (400)

```json
{
  "status": 400,
  "message": "No image file provided",
  "data": null
}
```

2. **Invalid file type** (400)

```json
{
  "status": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.",
  "data": null
}
```

3. **Upload failed** (500)

```json
{
  "status": 500,
  "message": "Failed to upload image",
  "data": null
}
```

## Security Notes

1. **Authentication required**: Both endpoints require valid JWT token
2. **Token expiration**: Client-side auth tokens expire after 1 hour
3. **File validation**: Server validates file type and size
4. **Rate limiting**: Consider implementing rate limiting for production

## Testing

Test with cURL:

```bash
# Server-side upload
curl -X POST http://localhost:4000/api/common/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"

# Get auth params
curl -X GET http://localhost:4000/api/common/upload/auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Migration from Local Storage

If you were previously using local file storage, the new ImageKit integration:

- Uses memory storage (no local files)
- Returns ImageKit URLs instead of local paths
- Provides CDN benefits automatically
- Old local files remain in `/uploads` folder (can be deleted)
