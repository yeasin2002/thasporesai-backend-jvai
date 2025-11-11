import consola from "consola";
import type { ServiceAccount } from "firebase-admin";
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Reads service account credentials from file system
 */
export const initializeFirebase = (): admin.app.App => {
	if (firebaseApp) {
		return firebaseApp;
	}

	try {
		// Path to your Firebase service account key JSON file
		const serviceAccountPath = path.join(
			process.cwd(),
			"firebase-service-account.json",
		);

		// Check if file exists
		if (!fs.existsSync(serviceAccountPath)) {
			throw new Error(
				"Firebase service account file not found. Please add 'firebase-service-account.json' to project root.",
			);
		}

		// Read and parse service account
		const serviceAccount = JSON.parse(
			fs.readFileSync(serviceAccountPath, "utf8"),
		) as ServiceAccount;

		// Initialize Firebase Admin
		firebaseApp = admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
		});

		consola.warn(" Firebase Admin SDK initialized successfully");
		return firebaseApp;
	} catch (error) {
		consola.error("❌ Failed to initialize Firebase Admin SDK:", error);
		consola.warn(
      "⚠️ Firebase initialization failed. Push notifications will not work."
    );
		throw error;
	}
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = (): admin.app.App => {
	if (!firebaseApp) {
		return initializeFirebase();
	}
	return firebaseApp;
};

/**
 * Get Firebase Messaging instance
 */
export const getMessaging = (): admin.messaging.Messaging => {
	const app = getFirebaseAdmin();
	return admin.messaging(app);
};
