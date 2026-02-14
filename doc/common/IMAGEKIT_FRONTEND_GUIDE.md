# ImageKit Integration - Flutter Frontend Guide

## Overview

JobSphere backend provides two methods for uploading images to ImageKit CDN.

---

## Upload Methods

### Method 1: Server Upload (Simple)

Upload through backend server.

**Pros:** Simple, secure, validated
**Cons:** Slower, uses server bandwidth

**Use for:** Profile pictures, small images

---

### Method 2: Direct Upload (Fast)

Upload directly to ImageKit CDN.

**Pros:** Fast, scalable, reduces server load
**Cons:** Requires two API calls

**Use for:** Large images, portfolios, job images

---

## API Endpoints

### Base URL

```
https://your-api.com
```

### 1. Server Upload

**Endpoint:**

```
POST /api/common/upload
```

**Headers:**

```
Authorization: Bearer {your_auth_token}
Content-Type: multipart/form-data
```

**Body:**

```
image: File
```

**Response:**

```json
{
  "status": 200,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://ik.imagekit.io/your_id/uploads/image.jpg",
    "fileId": "abc123",
    "filename": "image.jpg",
    "size": 245678,
    "thumbnailUrl": "https://ik.imagekit.io/.../thumbnail.jpg"
  }
}
```

---

### 2. Get Auth for Direct Upload

**Step 1: Get Authentication**

**Endpoint:**

```
GET /api/common/upload/auth
```

**Headers:**

```
Authorization: Bearer {your_auth_token}
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "token": "unique_token",
    "expire": 1234567890,
    "signature": "signature_hash",
    "publicKey": "public_key_xxx",
    "urlEndpoint": "https://ik.imagekit.io/your_id"
  }
}
```

**Step 2: Upload to ImageKit**

**Endpoint:**

```
POST {urlEndpoint}/api/v1/files/upload
```

**Body (multipart/form-data):**

```
file: File
fileName: string
publicKey: string (from step 1)
signature: string (from step 1)
expire: number (from step 1)
token: string (from step 1)
folder: "/uploads" (optional)
```

**Response:**

```json
{
  "fileId": "abc123",
  "name": "image.jpg",
  "url": "https://ik.imagekit.io/your_id/uploads/image.jpg",
  "thumbnailUrl": "https://ik.imagekit.io/.../thumbnail.jpg",
  "size": 245678,
  "filePath": "/uploads/image.jpg"
}
```

---

## Flutter Implementation

### Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  image_picker: ^1.0.4
```

### Example: Server Upload

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

Future<String?> uploadImage(File imageFile, String token) async {
  try {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('https://your-api.com/api/common/upload'),
    );

    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(
      await http.MultipartFile.fromPath('image', imageFile.path),
    );

    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    final result = json.decode(responseData);

    if (response.statusCode == 200) {
      return result['data']['url'];
    }
    return null;
  } catch (e) {
    print('Upload error: $e');
    return null;
  }
}
```

### Example: Direct Upload

```dart
Future<String?> uploadImageDirect(File imageFile, String token) async {
  try {
    // Step 1: Get auth params
    final authResponse = await http.get(
      Uri.parse('https://your-api.com/api/common/upload/auth'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (authResponse.statusCode != 200) return null;

    final authData = json.decode(authResponse.body)['data'];

    // Step 2: Upload to ImageKit
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${authData['urlEndpoint']}/api/v1/files/upload'),
    );

    request.files.add(
      await http.MultipartFile.fromPath('file', imageFile.path),
    );

    request.fields['fileName'] = imageFile.path.split('/').last;
    request.fields['publicKey'] = authData['publicKey'];
    request.fields['signature'] = authData['signature'];
    request.fields['expire'] = authData['expire'].toString();
    request.fields['token'] = authData['token'];
    request.fields['folder'] = '/uploads';

    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    final result = json.decode(responseData);

    if (response.statusCode == 200) {
      return result['url'];
    }
    return null;
  } catch (e) {
    print('Upload error: $e');
    return null;
  }
}
```

### Example: Pick and Upload

```dart
import 'package:image_picker/image_picker.dart';

Future<void> pickAndUpload() async {
  final picker = ImagePicker();
  final image = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 1920,
    maxHeight: 1920,
    imageQuality: 85,
  );

  if (image != null) {
    final imageUrl = await uploadImage(
      File(image.path),
      'your_auth_token',
    );

    if (imageUrl != null) {
      print('Uploaded: $imageUrl');
      // Save URL to your backend or state
    }
  }
}
```

---

## Image Transformations

ImageKit provides URL-based transformations. Just modify the URL.

### Examples

```dart
// Original URL
final originalUrl = 'https://ik.imagekit.io/your_id/uploads/image.jpg';

// Thumbnail (200x200)
final thumbnail = '$originalUrl?tr=w-200,h-200';

// Optimized for web
final optimized = '$originalUrl?tr=q-80,f-auto';

// Responsive
final responsive = '$originalUrl?tr=w-800,f-auto';
```

### Helper Class

```dart
class ImageTransformer {
  static String thumbnail(String url, {int size = 200}) {
    return '$url?tr=w-$size,h-$size';
  }

  static String optimized(String url, {int quality = 80}) {
    return '$url?tr=q-$quality,f-auto';
  }

  static String resize(String url, int width) {
    return '$url?tr=w-$width,f-auto';
  }
}

// Usage
Image.network(ImageTransformer.thumbnail(imageUrl))
```

### Common Parameters

- `w-{width}` - Set width
- `h-{height}` - Set height
- `q-{quality}` - Quality (1-100)
- `f-auto` - Auto format (WebP when supported)
- `c-at_max` - Crop to fit

---

## Permissions

### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.CAMERA"/>
```

### iOS

Add to `ios/Runner/Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library</string>
<key>NSCameraUsageDescription</key>
<string>We need access to your camera</string>
```

---

## Error Handling

### Common Errors

**401 Unauthorized:**

```dart
if (response.statusCode == 401) {
  // Token expired, refresh or re-login
}
```

**400 Bad Request:**

```dart
if (response.statusCode == 400) {
  // Invalid file type or size
  showError('Invalid image file');
}
```

**500 Server Error:**

```dart
if (response.statusCode == 500) {
  // Server issue, try again
  showError('Upload failed. Please try again');
}
```

### Example with Error Handling

```dart
Future<String?> uploadWithErrorHandling(File file, String token) async {
  try {
    final url = await uploadImage(file, token);
    return url;
  } on SocketException {
    showError('No internet connection');
  } on HttpException {
    showError('Server error');
  } catch (e) {
    showError('Upload failed: $e');
  }
  return null;
}
```

---

## Best Practices

### 1. Compress Before Upload

```dart
import 'package:flutter_image_compress/flutter_image_compress.dart';

Future<File?> compressImage(File file) async {
  final result = await FlutterImageCompress.compressAndGetFile(
    file.path,
    '${file.path}_compressed.jpg',
    quality: 85,
    minWidth: 1920,
    minHeight: 1920,
  );
  return result;
}
```

### 2. Validate File Size

```dart
Future<bool> isValidSize(File file, {int maxMB = 5}) async {
  final bytes = await file.length();
  final sizeMB = bytes / (1024 * 1024);
  return sizeMB <= maxMB;
}
```

### 3. Use Thumbnails for Lists

```dart
// List view - use thumbnail
Image.network('$imageUrl?tr=w-200,h-200')

// Detail view - use optimized
Image.network('$imageUrl?tr=q-80,f-auto')
```

### 4. Cache Images

```dart
// Add to pubspec.yaml
dependencies:
  cached_network_image: ^3.3.0

// Usage
CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
)
```

---

## Testing

### Test Upload

```dart
void testUpload() async {
  final file = File('path/to/test/image.jpg');
  final token = 'your_test_token';

  final url = await uploadImage(file, token);
  print('Upload result: $url');
}
```

---

## Troubleshooting

### Upload Fails

**Check:**

- Internet connection
- Auth token is valid
- File size < 5MB
- File type is JPEG/PNG/GIF/WebP/SVG

### Permission Denied

**Solution:**

- Add permissions to AndroidManifest.xml and Info.plist
- Request permissions at runtime

### Image Not Displaying

**Check:**

- URL is valid ImageKit URL
- Image exists in ImageKit dashboard
- Network connection available

---

## Resources

- [Backend API Docs](./IMAGEKIT_BACKEND_GUIDE.md)
- [ImageKit Transformations](https://docs.imagekit.io/features/image-transformations)
- [image_picker Package](https://pub.dev/packages/image_picker)
- [cached_network_image Package](https://pub.dev/packages/cached_network_image)

---

## Quick Reference

### Server Upload

```dart
POST /api/common/upload
Headers: Authorization: Bearer {token}
Body: image file
```

### Direct Upload

```dart
1. GET /api/common/upload/auth
2. POST {urlEndpoint}/api/v1/files/upload
```

### Transformations

```dart
Thumbnail: ?tr=w-200,h-200
Optimized: ?tr=q-80,f-auto
Responsive: ?tr=w-800,f-auto
```
