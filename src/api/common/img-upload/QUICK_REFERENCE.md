# ImageKit Upload - Quick Reference

## Environment Setup

```env
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## API Endpoints

### Server-Side Upload
```
POST /api/common/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: { image: File }
```

### Get Auth for Client-Side Upload
```
GET /api/common/upload/auth
Authorization: Bearer {token}
```

## Code Examples

### JavaScript/React - Server Upload

```javascript
async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('http://localhost:4000/api/common/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const result = await response.json();
  return result.data.url;
}
```

### JavaScript/React - Client-Side Upload

```javascript
async function uploadImageDirect(file, token) {
  // Step 1: Get auth params
  const authRes = await fetch('http://localhost:4000/api/common/upload/auth', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data: auth } = await authRes.json();
  
  // Step 2: Upload to ImageKit
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('publicKey', auth.publicKey);
  formData.append('signature', auth.signature);
  formData.append('expire', auth.expire);
  formData.append('token', auth.token);
  
  const uploadRes = await fetch(`${auth.urlEndpoint}/api/v1/files/upload`, {
    method: 'POST',
    body: formData
  });
  
  const result = await uploadRes.json();
  return result.url;
}
```

### Flutter - Server Upload

```dart
import 'package:http/http.dart' as http;

Future<String> uploadImage(File imageFile, String token) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://localhost:4000/api/common/upload'),
  );
  
  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));
  
  final response = await request.send();
  final responseData = await response.stream.bytesToString();
  final result = json.decode(responseData);
  
  return result['data']['url'];
}
```

### Flutter - Client-Side Upload

```dart
Future<String> uploadImageDirect(File imageFile, String token) async {
  // Step 1: Get auth params
  final authResponse = await http.get(
    Uri.parse('http://localhost:4000/api/common/upload/auth'),
    headers: {'Authorization': 'Bearer $token'},
  );
  final auth = json.decode(authResponse.body)['data'];
  
  // Step 2: Upload to ImageKit
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('${auth['urlEndpoint']}/api/v1/files/upload'),
  );
  
  request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));
  request.fields['fileName'] = imageFile.path.split('/').last;
  request.fields['publicKey'] = auth['publicKey'];
  request.fields['signature'] = auth['signature'];
  request.fields['expire'] = auth['expire'].toString();
  request.fields['token'] = auth['token'];
  
  final response = await request.send();
  final responseData = await response.stream.bytesToString();
  final result = json.decode(responseData);
  
  return result['url'];
}
```

## Response Format

### Server Upload Response
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
    "thumbnailUrl": "https://ik.imagekit.io/.../image.jpg",
    "filePath": "/uploads/image.jpg"
  }
}
```

### Auth Response
```json
{
  "status": 200,
  "message": "Authentication parameters generated successfully",
  "data": {
    "token": "unique_token",
    "expire": 1234567890,
    "signature": "signature_hash",
    "publicKey": "public_key_xxx",
    "urlEndpoint": "https://ik.imagekit.io/your_id"
  }
}
```

## Image Transformations

```javascript
const baseUrl = "https://ik.imagekit.io/your_id/uploads/image.jpg";

// Thumbnail
const thumb = `${baseUrl}?tr=w-200,h-200`;

// Optimized
const optimized = `${baseUrl}?tr=w-800,q-80,f-auto`;

// Cropped
const cropped = `${baseUrl}?tr=w-400,h-300,c-at_max`;

// Multiple
const multi = `${baseUrl}?tr=w-600,h-400,q-85,f-auto,c-maintain_ratio`;
```

### Common Transformations
- `w-{width}` - Width in pixels
- `h-{height}` - Height in pixels
- `q-{quality}` - Quality (1-100)
- `f-auto` - Auto format (WebP when supported)
- `c-at_max` - Crop mode
- `c-maintain_ratio` - Maintain aspect ratio

## File Validation

**Allowed types**: JPEG, PNG, GIF, WebP, SVG
**Max size**: 5MB (configurable)

## Error Codes

- `400` - No file provided or invalid file type
- `401` - Unauthorized (missing/invalid token)
- `500` - Upload failed (check server logs)

## Testing

```bash
# Server upload
curl -X POST http://localhost:4000/api/common/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg"

# Get auth
curl -X GET http://localhost:4000/api/common/upload/auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## When to Use Which?

**Server-Side**: Simple, secure, easy validation
**Client-Side**: Faster, scalable, reduces server load

## Files Modified

- `src/lib/imagekit.ts` - ImageKit client
- `src/lib/Env.ts` - Environment config
- `src/lib/multer.ts` - Memory storage
- `src/api/common/img-upload/upload-image.service.ts` - Upload services
- `src/api/common/common.route.ts` - Routes
- `src/api/common/img-upload/img-upload.validation.ts` - Schemas
- `src/api/common/img-upload/img-upload.openapi.ts` - API docs
