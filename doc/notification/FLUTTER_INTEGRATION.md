# Flutter Push Notification Integration Guide

This guide provides step-by-step instructions for integrating Firebase Cloud Messaging (FCM) push notifications in your Flutter mobile app with the JobSphere backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Flutter Setup](#flutter-setup)
3. [Implementation](#implementation)
4. [Testing](#testing)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Flutter SDK installed (3.0.0 or higher)
- ✅ Firebase project created (see [PUSH_NOTIFICATION_SETUP.md](./PUSH_NOTIFICATION_SETUP.md))
- ✅ Android/iOS app registered in Firebase Console
- ✅ Backend server running with Firebase Admin SDK configured
- ✅ User authentication working (to get access token)

---

## Flutter Setup

### Step 1: Add Dependencies

Add the following packages to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase Core (required)
  firebase_core: ^3.8.1
  
  # Firebase Messaging for push notifications
  firebase_messaging: ^15.1.5
  
  # Local notifications (for foreground notifications)
  flutter_local_notifications: ^18.0.1
  
  # HTTP client for API calls
  http: ^1.2.2
  
  # Secure storage for tokens
  flutter_secure_storage: ^9.2.2
```

Run:
```bash
flutter pub get
```

### Step 2: Configure Android

#### 2.1 Add google-services.json

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/` directory

```
your_flutter_app/
└── android/
    └── app/
        └── google-services.json  ← Place here
```

#### 2.2 Update android/build.gradle

```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

#### 2.3 Update android/app/build.gradle

```gradle
// At the top
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

// At the bottom
apply plugin: 'com.google.gms.google-services'

android {
    defaultConfig {
        minSdkVersion 21  // FCM requires minimum SDK 21
    }
}
```

#### 2.4 Update AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <application>
        <!-- ... existing code ... -->
        
        <!-- FCM default notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="high_importance_channel" />
            
        <!-- FCM notification icon (optional) -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
    </application>
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
</manifest>
```

### Step 3: Configure iOS

#### 3.1 Add GoogleService-Info.plist

1. Download `GoogleService-Info.plist` from Firebase Console
2. Open Xcode: `open ios/Runner.xcworkspace`
3. Drag `GoogleService-Info.plist` into `Runner` folder in Xcode
4. Ensure "Copy items if needed" is checked

#### 3.2 Enable Push Notifications Capability

In Xcode:
1. Select **Runner** project
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability**
4. Add **Push Notifications**
5. Add **Background Modes** and check:
   - ✅ Remote notifications
   - ✅ Background fetch

#### 3.3 Update AppDelegate.swift

Update `ios/Runner/AppDelegate.swift`:

```swift
import UIKit
import Flutter
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    
    // Request notification permissions
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { _, _ in }
      )
    } else {
      let settings: UIUserNotificationSettings =
        UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
    }
    
    application.registerForRemoteNotifications()
    
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

---

## Implementation

### Step 1: Initialize Firebase

Create `lib/services/firebase_service.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
  // Handle background notification here
}

class FirebaseService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Initialize Firebase and FCM
  static Future<void> initialize() async {
    // Initialize Firebase
    await Firebase.initializeApp();

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request notification permissions (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    print('Notification permission status: ${settings.authorizationStatus}');

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Setup message handlers
    _setupMessageHandlers();
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
        _handleNotificationTap(response.payload);
      },
    );

    // Create Android notification channel
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

  /// Setup FCM message handlers
  static void _setupMessageHandlers() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Foreground message received: ${message.messageId}');
      _showLocalNotification(message);
    });

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification opened app: ${message.messageId}');
      _handleNotificationTap(message.data['notificationId']);
    });

    // Check if app was opened from terminated state
    _messaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        print('App opened from terminated state: ${message.messageId}');
        _handleNotificationTap(message.data['notificationId']);
      }
    });
  }

  /// Show local notification for foreground messages
  static Future<void> _showLocalNotification(RemoteMessage message) async {
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
            channelDescription: 'This channel is used for important notifications.',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: message.data['notificationId'],
      );
    }
  }

  /// Handle notification tap
  static void _handleNotificationTap(String? notificationId) {
    if (notificationId != null) {
      // Navigate to notification details screen
      // You'll implement this based on your navigation setup
      print('Navigate to notification: $notificationId');
      // Example: Get.toNamed('/notification-details', arguments: notificationId);
    }
  }

  /// Get FCM token
  static Future<String?> getToken() async {
    try {
      String? token = await _messaging.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }

  /// Listen to token refresh
  static void onTokenRefresh(Function(String) callback) {
    _messaging.onTokenRefresh.listen(callback);
  }

  /// Delete FCM token
  static Future<void> deleteToken() async {
    await _messaging.deleteToken();
  }
}
```

### Step 2: Create API Service

Create `lib/services/notification_api_service.dart`:

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class NotificationApiService {
  static const String baseUrl = 'http://your-backend-url.com/api';
  static const _storage = FlutterSecureStorage();

  /// Get access token from secure storage
  static Future<String?> _getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  /// Register FCM token with backend
  static Future<bool> registerToken(String fcmToken) async {
    try {
      final accessToken = await _getAccessToken();
      if (accessToken == null) {
        print('No access token found');
        return false;
      }

      // Get device info
      final deviceId = await _getDeviceId();
      final deviceType = Platform.isAndroid ? 'android' : 'ios';

      final response = await http.post(
        Uri.parse('$baseUrl/notification/register-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'token': fcmToken,
          'deviceId': deviceId,
          'deviceType': deviceType,
        }),
      );

      if (response.statusCode == 200) {
        print('FCM token registered successfully');
        return true;
      } else {
        print('Failed to register token: ${response.body}');
        return false;
      }
    } catch (e) {
      print('Error registering token: $e');
      return false;
    }
  }

  /// Unregister FCM token from backend
  static Future<bool> unregisterToken(String fcmToken) async {
    try {
      final accessToken = await _getAccessToken();
      if (accessToken == null) return false;

      final response = await http.delete(
        Uri.parse('$baseUrl/notification/unregister-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'token': fcmToken,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error unregistering token: $e');
      return false;
    }
  }

  /// Fetch user notifications
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final accessToken = await _getAccessToken();
      if (accessToken == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/notification'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  /// Mark notifications as read
  static Future<bool> markAsRead(List<String> notificationIds) async {
    try {
      final accessToken = await _getAccessToken();
      if (accessToken == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/notification/mark-read'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'notificationIds': notificationIds,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking as read: $e');
      return false;
    }
  }

  /// Delete notification
  static Future<bool> deleteNotification(String notificationId) async {
    try {
      final accessToken = await _getAccessToken();
      if (accessToken == null) return false;

      final response = await http.delete(
        Uri.parse('$baseUrl/notification/$notificationId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting notification: $e');
      return false;
    }
  }

  /// Get unique device ID
  static Future<String> _getDeviceId() async {
    // You can use device_info_plus package for real device ID
    // For now, generate a simple ID
    String? deviceId = await _storage.read(key: 'device_id');
    if (deviceId == null) {
      deviceId = DateTime.now().millisecondsSinceEpoch.toString();
      await _storage.write(key: 'device_id', value: deviceId);
    }
    return deviceId;
  }
}
```

### Step 3: Initialize in main.dart

Update your `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'services/firebase_service.dart';
import 'services/notification_api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await FirebaseService.initialize();
  
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _setupNotifications();
  }

  Future<void> _setupNotifications() async {
    // Get FCM token
    String? token = await FirebaseService.getToken();
    
    if (token != null) {
      // Register token with backend (after user logs in)
      // You should call this after successful login
      // await NotificationApiService.registerToken(token);
    }

    // Listen for token refresh
    FirebaseService.onTokenRefresh((newToken) async {
      print('Token refreshed: $newToken');
      await NotificationApiService.registerToken(newToken);
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JobSphere',
      home: HomeScreen(),
    );
  }
}
```

### Step 4: Register Token After Login

In your login success handler:

```dart
// After successful login
Future<void> onLoginSuccess(String accessToken) async {
  // Save access token
  await const FlutterSecureStorage().write(
    key: 'access_token',
    value: accessToken,
  );

  // Get and register FCM token
  String? fcmToken = await FirebaseService.getToken();
  if (fcmToken != null) {
    await NotificationApiService.registerToken(fcmToken);
  }

  // Navigate to home screen
}
```

### Step 5: Unregister Token on Logout

In your logout handler:

```dart
Future<void> onLogout() async {
  // Get current FCM token
  String? fcmToken = await FirebaseService.getToken();
  
  if (fcmToken != null) {
    // Unregister from backend
    await NotificationApiService.unregisterToken(fcmToken);
  }

  // Clear access token
  await const FlutterSecureStorage().delete(key: 'access_token');

  // Navigate to login screen
}
```

### Step 6: Create Notifications Screen

Create `lib/screens/notifications_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../services/notification_api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> notifications = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => isLoading = true);
    final data = await NotificationApiService.getNotifications();
    setState(() {
      notifications = data;
      isLoading = false;
    });
  }

  Future<void> _markAsRead(String notificationId) async {
    await NotificationApiService.markAsRead([notificationId]);
    _loadNotifications();
  }

  Future<void> _deleteNotification(String notificationId) async {
    await NotificationApiService.deleteNotification(notificationId);
    _loadNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : notifications.isEmpty
              ? const Center(child: Text('No notifications'))
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      final isRead = notification['isRead'] ?? false;

                      return Dismissible(
                        key: Key(notification['_id']),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          color: Colors.red,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) {
                          _deleteNotification(notification['_id']);
                        },
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isRead ? Colors.grey : Colors.blue,
                            child: Icon(
                              _getIconForType(notification['type']),
                              color: Colors.white,
                            ),
                          ),
                          title: Text(
                            notification['title'],
                            style: TextStyle(
                              fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                            ),
                          ),
                          subtitle: Text(notification['body']),
                          trailing: Text(
                            _formatDate(notification['createdAt']),
                            style: const TextStyle(fontSize: 12),
                          ),
                          onTap: () {
                            if (!isRead) {
                              _markAsRead(notification['_id']);
                            }
                            // Navigate to relevant screen based on notification type
                            _handleNotificationTap(notification);
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'job_posted':
        return Icons.work;
      case 'job_application':
        return Icons.assignment;
      case 'booking_confirmed':
        return Icons.check_circle;
      case 'message_received':
        return Icons.message;
      case 'payment_received':
        return Icons.payment;
      default:
        return Icons.notifications;
    }
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  void _handleNotificationTap(Map<String, dynamic> notification) {
    // Navigate based on notification type and data
    final type = notification['type'];
    final data = notification['data'] ?? {};

    switch (type) {
      case 'job_posted':
        // Navigate to job details
        // Navigator.push(context, MaterialPageRoute(builder: (_) => JobDetailsScreen(jobId: data['jobId'])));
        break;
      case 'message_received':
        // Navigate to chat
        break;
      // Add more cases as needed
    }
  }
}
```

---

## Testing

### Test on Android

1. Build and run the app:
```bash
flutter run
```

2. Login to the app
3. Check console for FCM token
4. Send test notification from backend
5. Verify notification appears

### Test on iOS

1. Use a physical device (simulator doesn't support push notifications)
2. Build and run:
```bash
flutter run
```

3. Grant notification permissions when prompted
4. Login and verify token registration
5. Send test notification

### Test Scenarios

✅ **Foreground**: App is open and active
✅ **Background**: App is minimized
✅ **Terminated**: App is completely closed
✅ **Notification tap**: Opens correct screen
✅ **Token refresh**: New token registered automatically

---

## Best Practices

### 1. Token Management

- Register token immediately after login
- Unregister token on logout
- Handle token refresh automatically
- Store device ID persistently

### 2. Notification Handling

- Show local notifications for foreground messages
- Handle notification taps appropriately
- Navigate to relevant screens based on notification type
- Update notification badge count

### 3. User Experience

- Request permissions at appropriate time
- Provide notification settings in app
- Allow users to mute specific notification types
- Show notification history in-app

### 4. Error Handling

- Handle network errors gracefully
- Retry failed token registrations
- Log errors for debugging
- Provide user feedback

### 5. Security

- Store access tokens securely (flutter_secure_storage)
- Never log sensitive data
- Validate notification data before use
- Use HTTPS for all API calls

---

## Troubleshooting

### Issue: "MissingPluginException"

**Solution:** Run `flutter clean` and rebuild:
```bash
flutter clean
flutter pub get
flutter run
```

### Issue: Notifications not received on iOS

**Checklist:**
1. ✅ Using physical device (not simulator)
2. ✅ Push Notifications capability enabled in Xcode
3. ✅ APNs certificate configured in Firebase Console
4. ✅ Notification permissions granted
5. ✅ App is registered for remote notifications

### Issue: Token registration fails

**Solution:** Check:
- Backend server is running
- Access token is valid
- API endpoint URL is correct
- Network connectivity

### Issue: Foreground notifications not showing

**Solution:** Ensure local notifications are initialized and notification channel is created (Android).

### Issue: App crashes on notification tap

**Solution:** Verify notification data structure and handle null values properly.

---

## Additional Resources

- [Firebase Flutter Documentation](https://firebase.flutter.dev/)
- [FCM Flutter Plugin](https://pub.dev/packages/firebase_messaging)
- [Local Notifications Plugin](https://pub.dev/packages/flutter_local_notifications)
- [Flutter Secure Storage](https://pub.dev/packages/flutter_secure_storage)

---

## Summary

You've successfully integrated push notifications in your Flutter app! The system now:

✅ Receives push notifications via FCM
✅ Registers device tokens with backend
✅ Displays notifications in all app states
✅ Handles notification taps
✅ Manages notification history
✅ Supports both Android and iOS

Next steps:
- Customize notification UI
- Add notification preferences
- Implement deep linking
- Test on production
