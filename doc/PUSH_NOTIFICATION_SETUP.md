# Push Notification Setup Guide

This guide provides complete instructions for setting up Firebase Cloud Messaging (FCM) push notifications in JobSphere.

## Table of Contents

1. [Firebase Setup](#firebase-setup)
2. [Backend Configuration](#backend-configuration)
3. [Testing the System](#testing-the-system)
4. [Flutter Integration Guide](#flutter-integration-guide)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name (e.g., "JobSphere")
4. Follow the setup wizard

### Step 2: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Note your **Server Key** and **Sender ID** (needed for Flutter)

### Step 3: Generate Service Account Key

1. In Firebase Console, go to **Project Settings**
2. Navigate to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file
5. Rename it to `firebase-service-account.json`
6. Place it in your project root directory (same level as `package.json`)

**⚠️ IMPORTANT**: Add `firebase-service-account.json` to `.gitignore` to prevent committing sensitive credentials!

```bash
# Add to .gitignore
firebase-service-account.json
```

### Step 4: Service Account JSON Structure

Your `firebase-service-account.json` should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## Backend Configuration

### Step 1: Install Depend