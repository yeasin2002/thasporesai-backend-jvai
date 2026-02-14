# ImageKit Integration - Migration Summary

## ✅ What Was Completed

### 1. Core Implementation

- ✅ Created ImageKit client configuration (`src/lib/imagekit.ts`)
- ✅ Updated environment configuration (`src/lib/Env.ts`)
- ✅ Exported ImageKit utilities (`src/lib/index.ts`)
- ✅ Updated multer to use memory storage instead of disk storage

### 2. Upload Services

- ✅ **Server-side upload**: Updated `upload-image.service.ts` to use ImageKit
- ✅ **Client-side upload**: Created `getImageKitAuth` service for direct frontend uploads

### 3. API Routes

- ✅ `POST /api/common/upload` - Server-side upload to ImageKit
- ✅ `GET /api/common/upload/auth` - Get auth params for client-side upload

### 4. Validation & Documentation

- ✅ Updated Zod schemas with new response formats
- ✅ Updated OpenAPI documentation for both endpoints
- ✅ Added comprehensive API documentation

### 5. Documentation

- ✅ Created detailed README (`src/api/common/img-upload/README.md`)
- ✅ Created setup guide (`doc/common/IMAGEKIT_SETUP.md`)
- ✅ Created quick reference (`src/api/common/img-upload/QUICK_REFERENCE.md`)

## 🔧 What You Need to Do

### Step 1: Get ImageKit Credentials

1. Go to [imagekit.io](https://imagekit.io/) and sign up (free tier available)
2. Navigate to **Dashboard** → **Developer** → **API Keys**
3. Copy your credentials:
   - Public Key
   - Private Key
   - URL Endpoint

### Step 2: Update Environment Variables

Update your `.env` file with actual values:

```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### Step 3: Restart Server

```bash
bun dev
```

Look for this log message:

```
✓ ImageKit initialized
```

### Step 4: Test the Integration

#### Test Server-Side Upload

```bash
curl -X POST http://localhost:4000/api/common/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

#### Test Auth Endpoint

```bash
curl -X GET http://localhost:4000/api/common/upload/auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 API Changes

### Before (Local Storage)

```javascript
// Response
{
  "url": "http://localhost:4000/uploads/image-123456.jpg",
  "filename": "image-123456.jpg",
  "originalName": "photo.jpg",
  "size": 245678,
  "mimetype": "image/jpeg"
}
```

### After (ImageKit)

```javascript
// Response
{
  "url": "https://ik.imagekit.io/your_id/uploads/image.jpg",
  "fileId": "abc123xyz",
  "filename": "image.jpg",
  "originalName": "photo.jpg",
  "size": 245678,
  "mimetype": "image/jpeg",
  "thumbnailUrl": "https://ik.imagekit.io/.../image.jpg",
  "filePath": "/uploads/image.jpg"
}
```

## 🎯 Two Upload Methods Available

### Method 1: Server-Side Upload (Simpler)

**Flow**: Frontend → Your Server → ImageKit

**Use when:**

- You need server-side validation
- You want to track uploads in your database
- Simplicity is more important than speed

**Example:**

```javascript
const formData = new FormData();
formData.append("image", file);

const response = await fetch("/api/common/upload", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

### Method 2: Client-Side Upload (Faster)

**Flow**: Frontend → Get Auth → Frontend → ImageKit (Direct)

**Use when:**

- You want faster uploads
- You want to reduce server bandwidth
- You're uploading large files

**Example:**

```javascript
// Step 1: Get auth params
const authRes = await fetch("/api/common/upload/auth", {
  headers: { Authorization: `Bearer ${token}` },
});
const { data: auth } = await authRes.json();

// Step 2: Upload directly to ImageKit
const formData = new FormData();
formData.append("file", file);
formData.append("fileName", file.name);
formData.append("publicKey", auth.publicKey);
formData.append("signature", auth.signature);
formData.append("expire", auth.expire);
formData.append("token", auth.token);

const uploadRes = await fetch(`${auth.urlEndpoint}/api/v1/files/upload`, {
  method: "POST",
  body: formData,
});
```

## 🎨 Image Transformations

ImageKit provides powerful URL-based transformations:

```javascript
const baseUrl = "https://ik.imagekit.io/your_id/uploads/image.jpg";

// Thumbnail
const thumb = `${baseUrl}?tr=w-200,h-200`;

// Optimized for web
const optimized = `${baseUrl}?tr=w-800,q-80,f-auto`;

// Responsive sizes
const small = `${baseUrl}?tr=w-400`;
const medium = `${baseUrl}?tr=w-800`;
const large = `${baseUrl}?tr=w-1200`;
```

## 📁 Files Modified

```
src/
├── lib/
│   ├── imagekit.ts          ✨ NEW - ImageKit client
│   ├── Env.ts               ✏️  UPDATED - Added ImageKit env vars
│   ├── index.ts             ✏️  UPDATED - Export imagekit
│   └── multer.ts            ✏️  UPDATED - Memory storage
├── api/common/
│   ├── common.route.ts      ✏️  UPDATED - Added auth route
│   └── img-upload/
│       ├── upload-image.service.ts  ✏️  UPDATED - ImageKit upload
│       ├── img-upload.validation.ts ✏️  UPDATED - New schemas
│       ├── img-upload.openapi.ts    ✏️  UPDATED - New endpoint docs
│       ├── README.md                ✨ NEW - Detailed guide
│       └── QUICK_REFERENCE.md       ✨ NEW - Quick reference
doc/
└── common/
    └── IMAGEKIT_SETUP.md    ✨ NEW - Setup guide
.env.example                 ✏️  UPDATED - ImageKit vars
```

## 🔍 Frontend Integration Examples

### React/JavaScript

```javascript
// Server-side upload
async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("http://localhost:4000/api/common/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const result = await response.json();
  return result.data.url;
}
```

### Flutter

```dart
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

## 🚀 Benefits of ImageKit

1. **Fast CDN Delivery**: Images served from global CDN
2. **Automatic Optimization**: WebP conversion, compression
3. **URL Transformations**: Resize, crop, optimize on-the-fly
4. **Reduced Server Load**: Direct uploads bypass your server
5. **Better Scalability**: No local storage management
6. **Built-in Thumbnails**: Automatic thumbnail generation

## 📚 Documentation Links

- **Detailed Guide**: `src/api/common/img-upload/README.md`
- **Setup Guide**: `doc/common/IMAGEKIT_SETUP.md`
- **Quick Reference**: `src/api/common/img-upload/QUICK_REFERENCE.md`
- **ImageKit Docs**: https://docs.imagekit.io/

## ⚠️ Important Notes

1. **No Breaking Changes**: Existing upload endpoint still works
2. **Response Format Changed**: Frontend may need updates to handle new fields
3. **Local Files**: Old files in `/uploads` folder are not deleted
4. **Memory Storage**: Files no longer saved to disk (only in memory during upload)
5. **Authentication Required**: Both endpoints require valid JWT token

## 🐛 Troubleshooting

### Server won't start

- Check that all three ImageKit env vars are set
- Verify no typos in variable names
- Restart server after adding variables

### Upload fails

- Verify ImageKit credentials in dashboard
- Check file size (max 5MB)
- Ensure file type is supported (JPEG, PNG, GIF, WebP, SVG)
- Check server logs for detailed error

### Auth endpoint fails

- Verify private key is correct
- Check token expiration
- Ensure user is authenticated

## ✅ Next Steps

1. ✅ Get ImageKit credentials
2. ✅ Update `.env` file
3. ✅ Restart server
4. ✅ Test both upload methods
5. ✅ Update frontend to use new response format
6. ✅ (Optional) Migrate existing images to ImageKit
7. ✅ (Optional) Update frontend to use client-side upload for better performance

---

**Need Help?** Check the documentation files or ImageKit's support at https://imagekit.io/support
