import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { createServer } from "node:http";
import swaggerUi from "swagger-ui-express";

import { auth } from "@/api/auth/auth.route";
import { category } from "@/api/category/category.route";
import { chat } from "@/api/chat/chat.route";
import { jobRequest } from "@/api/job-request/job-request.route";
import { job } from "@/api/job/job.route";
import { location } from "@/api/location/location.route";

// admin- dashboard routes
import { adminUser } from "@/api/admin/user/user.route";

// common routes

import { connectDB, generateOpenAPIDocument } from "@/lib";
import { errorHandler, notFoundHandler, requireRole } from "@/middleware";
import { authAdmin } from "./api/admin/auth-admin/auth-admin.route";
import { initializeSocketIO } from "./api/chat/socket";
import { common } from "./api/common/common.route";
import { getLocalIP } from "./lib/get-my-ip";

const app = express();
const httpServer = createServer(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use(morgan("dev"));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5173", "*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
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

app.use("/api/auth", auth);
app.use("/api/job", job);
app.use("/api/job-request", jobRequest);

app.use("/api/category", category);
app.use("/api/location", location);
app.use("/api/common", common);
app.use("/api/chat", chat);

// Admin routes
app.use("/api/admin/auth", authAdmin);

// Protected admin routes (require admin authentication)
app.use("/api/admin/users", requireRole("admin"), adminUser);
// app.use("/api/admin/dashboard", requireRole("admin"), dashboard);
// app.use("/api/admin/job", requireRole("admin"), adminJob);
// app.use("/api/admin/payments", requireRole("admin"), payments);
// app.use("/api/admin/settings", requireRole("admin"), settings);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;

// Initialize Socket.IO for real-time chat
initializeSocketIO(httpServer);

httpServer.listen(port, async () => {
  await connectDB();

  console.log(`🚀 Server is running on port http://localhost:${port}`);
  console.log(`✨ Server is running on port http://${getLocalIP()}:${port} \n`);

  console.log(`✍️ Swagger doc: http://localhost:${port}/swagger`);
  console.log(`📋 Scaler doc: http://localhost:${port}/scaler`);
  console.log(`💬 Socket.IO chat enabled \n`);
});
