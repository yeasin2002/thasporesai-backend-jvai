import consola from "consola";
import "dotenv/config";

import { httpServer } from "./app";
import { startOfferExpirationJob } from "./jobs/expire-offers";
import { retryFailedTransactions } from "./jobs/retry-failed-transactions";
import { connectDB, initializeFirebase, PORT } from "./lib";
import { getLocalIP } from "./lib/get-my-ip";

// Start the server
httpServer.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB();

  // Initialize Firebase Admin SDK for push notifications
  try {
    initializeFirebase();
  } catch {
    consola.warn(
      "⚠️ Firebase initialization failed. Push notifications will not work."
    );
  }
  consola.warn(" 💬 Socket.IO chat enabled \n");

  // Start offer expiration job
  startOfferExpirationJob();

  // Start failed transaction retry job (runs every hour)
  consola.info("🔄 Starting failed transaction retry job...");
  // Run immediately on startup
  retryFailedTransactions().catch((error) => {
    consola.error("❌ Initial retry job failed:", error);
  });
  // Then run every hour
  setInterval(
    () => {
      retryFailedTransactions().catch((error) => {
        consola.error("❌ Scheduled retry job failed:", error);
      });
    },
    60 * 60 * 1000
  ); // 1 hour

  // Log server information
  consola.log(`🚀 Server is running on port http://localhost:${PORT}`);
  consola.log(`✨ Server is running on port http://${getLocalIP()}:${PORT} \n`);

  consola.info("Doc: ");
  consola.log(`✍️  Swagger doc: http://localhost:${PORT}/swagger`);
  consola.log(`📋 Scaler doc: http://localhost:${PORT}/scaler \n`);
});
