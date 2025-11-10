# Mobile App Integration Guide (Flutter)

## Overview

This guide covers how to integrate Firebase Cloud Messaging (FCM) push notifications in your Flutter mobile app to work with the JobSphere backend.

## Prerequisites

- Flutter project set up
- Firebase project created (same one used by backend)
- `firebase_messaging` package
- `firebase_core` package

## Flutter Setup

### 1. Add Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.8.1
  firebase_messaging: ^15.1.5
  flutter_local_notifications: ^18.0.1  # For foreground notifications
```

Run:
```bash
flutter pub get
```

### 2. Configure Firebase for Flutter

#### Android Configuration

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Update `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

4. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

android {
    defaultConfig {
        minSdkVersion 21  // FCM requires minimum SDK 21
    }
}
```

5. Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    
    <application>
        <!-- ... -->
    </application>
</manifest>
```

#### iOS Configuration

1. Download `GoogleService-Info.plist` from Firebase Console
2. Place it in `ios/Runner/GoogleService-Info.plist`
3. Open `ios/Runner.xcworkspace` in Xcode
4. Enable Push Notifications capability
5. Add to `ios/Runner/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### 3. Initialize Firebase in Flutter

Create `lib/services/firebase_service.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FirebaseService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Initialize Firebase and FCM
  static Future<void> initialize() async {
    // Initialize Firebase
    await Firebase.initializeApp();

    // Request notification permissions (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted notification permission');
    } else {
      print('❌ User declined notification permission');
    }

    // Initialize local notifications for foreground
    await _initializeLocalNotifications();

    // Get FCM token
    String? token = await _messaging.getToken();
    if (token != null) {
      print('📱 FCM Token: $token');
      // Send token to backend
      await _registerTokenWithBackend(token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      print('🔄 FCM Token refreshed: $newToken');
      _registerTokenWithBackend(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification tap (app opened from notification)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a notification
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  /// Initialize local notifications for foreground display
  static Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap
        print('Notification tapped: ${response.payload}');
      },
    );

    // Create notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications.',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// Register FCM token with backend
  static Future<void> _registerTokenWithBackend(String token) async {
    try {
      // Get device info
      String deviceId = await _getDeviceId();
      String deviceType = Platform.isAndroid ? 'android' : 'ios';

      // Call backend API
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/notification/register-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAccessToken()}',
        },
        body: jsonEncode({
          'token': token,
          'deviceId': deviceId,
          'deviceType': deviceType,
        }),
      );

      if (response.statusCode == 200) {
        print('✅ FCM token registered with backend');
      } else {
        print('❌ Failed to register FCM token: ${response.body}');
      }
    } catch (e) {
      print('❌ Error registering FCM token: $e');
    }
  }

  /// Handle foreground messages
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('📬 Foreground message received: ${message.notification?.title}');

    // Show local notification when app is in foreground
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: DarwinNotificationDetails(),
        ),
        payload: jsonEncode(message.data),
      );
    }
  }

  /// Handle notification tap
  static void _handleNotificationTap(RemoteMessage message) {
    print('🔔 Notification tapped: ${message.data}');

    // Navigate based on notification type
    String? type = message.data['type'];
    switch (type) {
      case 'job_posted':
        // Navigate to job details
        String? jobId = message.data['jobId'];
        // NavigationService.navigateTo('/job/$jobId');
        break;
      case 'message_received':
        // Navigate to chat
        String? conversationId = message.data['conversationId'];
        // NavigationService.navigateTo('/chat/$conversationId');
2. Get FCM token
3. Call POST /api/notification/register-token
4. Listen for token refresh
```

### 3. On Token Refresh

```
1. Get new FCM token
2. Call POST /api/notification/register-token with new token
```

### 4. On Logout

```
1. Get current FCM token
2. Call DELETE /api/notification/unregister-token
3. Clear access token
```

### 5. Receiving Notifications

```
Foreground:
- Show local notification
- Update in-app notification list

Background/Terminated:
- System shows notification automatically
- Handle tap to navigate to relevant screen
```

### 6. Viewing Notifications

```
1. Call GET /api/notification
2. Display list in UI
3. On tap, call POST /api/notification/mark-read
4. Navigate to relevant screen based on type
```

---

## Example: Flutter Implementation

### Register Token After Login

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> registerFcmToken(String accessToken) async {
  // Get FCM token
  String? fcmToken = await FirebaseMessaging.instance.getToken();

  if (fcmToken == null) return;

  // Register with backend
  final response = await http.post(
    Uri.parse('https://your-backend-url.com/api/notification/register-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'token': fcmToken,
      'deviceId': 'unique_device_id', // Generate or get from device
      'deviceType': Platform.isAndroid ? 'android' : 'ios',
    }),
  );

  if (response.statusCode == 200) {
    print('Token registered successfully');
  }
}
```

### Get All Notifications

```dart
Future<List<Map<String, dynamic>>> getNotifications(String accessToken) async {
  final response = await http.get(
    Uri.parse('https://your-backend-url.com/api/notification'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return List<Map<String, dynamic>>.from(data['data']);
  }

  return [];
}
```

### Mark as Read

```dart
Future<void> markAsRead(String accessToken, List<String> notificationIds) async {
  await http.post(
    Uri.parse('https://your-backend-url.com/api/notification/mark-read'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'notificationIds': notificationIds,
    }),
  );
}
```

### Unregister on Logout

```dart
Future<void> unregisterFcmToken(String accessToken, String fcmToken) async {
  await http.delete(
    Uri.parse('https://your-backend-url.com/api/notification/unregister-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({
      'token': fcmToken,
    }),
  );
}
```

---

## Testing

### 1. Test Token Registration

```bash
curl -X POST https://your-backend-url.com/api/notification/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "token": "test_fcm_token",
    "deviceId": "test_device_001",
    "deviceType": "android"
  }'
```

### 2. Test Get Notifications

```bash
curl -X GET https://your-backend-url.com/api/notification \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Mark as Read

```bash
curl -X POST https://your-backend-url.com/api/notification/mark-read \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "notificationIds": ["notification_id_1"]
  }'
```

---

## Important Notes

1. **Firebase Setup Required**: Your mobile app must have Firebase configured with FCM enabled
2. **Token Refresh**: Listen for FCM token refresh and re-register with backend
3. **Secure Storage**: Store access tokens securely (use flutter_secure_storage or similar)
4. **Error Handling**: Always handle network errors and invalid responses
5. **Notification Permissions**: Request permissions before getting FCM token
6. **HTTPS Only**: Use HTTPS in production for all API calls

---

## Support

For backend issues or questions, contact the backend team.

For Firebase setup, refer to:

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Flutter Documentation](https://firebase.flutter.dev/)
