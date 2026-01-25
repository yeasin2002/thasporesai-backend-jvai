import { apiReference } from "@scalar/express-api-reference";
import consola from "consola";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createServer } from "node:http";
import swaggerUi from "swagger-ui-express";

import { auth } from "@/api/auth/auth.route";
import { category } from "@/api/category/category.route";
import { chat } from "@/api/chat/chat.route";
import { delivery } from "@/api/delivery/delivery.route";
import { jobInvite } from "@/api/job-invite/job-invite.route";
import { jobRequest } from "@/api/job-request/job-request.route";
import { job } from "@/api/job/job.route";
import { location } from "@/api/location/location.route";
import { notification } from "@/api/notification/notification.route";
import { offer } from "@/api/offer/offer.route";
import { review } from "@/api/review/review.route";
import { seed } from "@/api/seed/seed.route";
import { testNotification } from "@/api/test-notification/test-notification.route";
import { webhook } from "@/api/webhooks/webhook.route";

// admin- dashboard routes
import { adminUser } from "@/api/admin/admin-user/admin-user.route";

// common routes
import {
  connectDB,
  generateOpenAPIDocument,
  initializeFirebase,
  PORT,
} from "@/lib";
import {
  errorHandler,
  notFoundHandler,
  requireAuth,
  requireRole,
} from "@/middleware";
import { authAdmin } from "./api/admin/auth-admin/auth-admin.route";
import { initializeSocketIO } from "./api/chat/socket";
import { common } from "./api/common/common.route";
import { startOfferExpirationJob } from "./jobs/expire-offers";
import { retryFailedTransactions } from "./jobs/retry-failed-transactions";
import { getLocalIP } from "./lib/get-my-ip";
import { morganDevFormat } from "./lib/morgan";

const app = express();
const httpServer = createServer(app);

// Register webhook route BEFORE body parser (needs raw body for signature verification)
app.use("/api/webhooks", webhook);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use(morgan(morganDevFormat));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://31.97.129.37:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.status(200).send("Not OK");
});

// OpenAPI documentation
const openApiDocument = generateOpenAPIDocument();
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use(
  "/scaler",
  apiReference({
    theme: "deepSpace",
    content: openApiDocument,
    favicon: "/uploads/logo.png",
  })
);
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});

// API Routes
app.use("/api/auth", auth);
app.use("/api/job", job);
app.use("/api/job-request", jobRequest);
app.use("/api/job-invite", jobInvite);
app.use("/api/category", category);
app.use("/api/location", location);
app.use("/api/review", review);
app.use("/api/common", common);
app.use("/api/notification", notification);
app.use("/api/test-notification", testNotification);
app.use("/api/chat", chat);
app.use("/api/seed", seed);

// Admin routes
app.use("/api/admin/auth", authAdmin);
app.use("/api/admin/users", requireAuth, requireRole("admin"), adminUser);

// User routes
import { certifications } from "./api/users/certifications/certifications.route";
import { experience } from "./api/users/experience/experience.route";
import { profile } from "./api/users/profile/profile.route";
import { workSamples } from "./api/users/work_samples/work_samples.route";
import { wallet } from "./api/wallet/wallet.route";

// Profile routes (main user endpoints)
app.use("/api/user", profile);

// User sub-modules (nested routes)
app.use("/api/user/certifications", certifications);
app.use("/api/user/experience", experience);
app.use("/api/user/work-samples", workSamples);

app.use("/api/wallet", wallet);
app.use("/api/offer", offer);
app.use("/api/delivery", delivery);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO
initializeSocketIO(httpServer);

httpServer.listen(PORT, async () => {
  await connectDB();

  // Initialize Firebase Admin SDK for push notifications
  try {
    initializeFirebase();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    consola.warn(
      "⚠️ Firebase initialization failed. Push notifications will not work."
    );
  }
  consola.warn(` 💬 Socket.IO chat enabled \n`);

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

  consola.log(`🚀 Server is running on port http://localhost:${PORT}`);
  consola.log(`✨ Server is running on port http://${getLocalIP()}:${PORT} \n`);

  consola.info("Doc: ");
  consola.log(`✍️  Swagger doc: http://localhost:${PORT}/swagger`);
  consola.log(`📋 Scaler doc: http://localhost:${PORT}/scaler \n`);
});
