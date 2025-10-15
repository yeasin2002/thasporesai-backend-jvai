import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { user } from "./api/user/user.route";
import { connectDB } from "./lib";
import { generateOpenAPIDocument } from "./lib/openapi";
import { errorHandler, notFoundHandler } from "./middleware/common";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "",
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

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
  apiReference({
    theme: "deepSpace",
    content: openApiDocument,
    // spec: {
    //   content: openapiSpecification,
    // },
  })
);

app.use("/api/user", user);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  // await connectDB();
  console.log(`Server is running on port ${port}`);
});
