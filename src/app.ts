import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { auth } from "@/api/auth/auth.route";
import { category } from "@/api/category/category.route";
import { job } from "@/api/job/job.route";
import { location } from "@/api/location/location.route";

// admin- dashboard routes
import { dashboard } from "@/api/admin/dashboard/dashboard.route";
import { adminJob } from "@/api/admin/job/job.route";
import { payments } from "@/api/admin/payments/payments.route";
import { settings } from "@/api/admin/settings/settings.route";
import { adminUser } from "@/api/admin/user/user.route";

import { connectDB, generateOpenAPIDocument } from "@/lib";
import { errorHandler, notFoundHandler } from "@/middleware";
import { getLocalIP } from "./lib/get-my-ip";

const app = express();
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
  apiReference({ theme: "deepSpace", content: openApiDocument })
);
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});

app.use("/api/auth", auth);
app.use("/api/category", category);
app.use("/api/job", job);
app.use("/api/location", location);

app.use("/api/admin/dashboard", dashboard);
app.use("/api/admin/users", adminUser);
app.use("/api/admin/job", adminJob);
app.use("/api/admin/payments", payments);
app.use("/api/admin/settings", settings);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  await connectDB();

  console.log(`🚀 Server is running on port http://localhost:${port}`);
  console.log(`✨ Server is running on port http://${getLocalIP()}:${port} \n`);

  console.log(`✍️ Swagger doc: http://localhost:${port}/swagger`);
  console.log(`📋 Scaler doc: http://localhost:${port}/scaler`);
});
