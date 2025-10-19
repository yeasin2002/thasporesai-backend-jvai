import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import {
  connectDB,
  generateOpenAPIDocument,
  logInfo,
  morganStream,
} from "@/lib";
import { errorHandler, notFoundHandler } from "@/middleware";

import { auth } from "@/api/auth/auth.route";
import { category } from "@/api/category/category.route";
import { job } from "@/api/job/job.route";
import { user } from "@/api/user/user.route";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// HTTP request logging with Morgan + Winston
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: morganStream,
  })
);

app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

// OpenAPI documentation
const openApiDocument = generateOpenAPIDocument();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});
app.use(
  "/scaler",
  apiReference({ theme: "deepSpace", content: openApiDocument })
);

app.use("/api/auth", auth);
app.use("/api/category", category);
app.use("/api/job", job);
app.use("/api/user", user);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, async () => {
	await connectDB();

	logInfo(`Server started on port ${port}`, {
    port,
    environment: process.env.NODE_ENV || "development",
  });

	console.log(`🚀 Server is running on port ${port}`);
	console.log("✍️ Swagger doc: http://localhost:4000/api-docs");
	console.log("📋 Scaler doc: http://localhost:4000/scaler");
});
