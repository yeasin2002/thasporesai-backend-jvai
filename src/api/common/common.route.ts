import "./img-upload/img-upload.openapi";

import { upload } from "@/lib/multer";
import { requireAuth } from "@/middleware";
import express, { type Router } from "express";
import {
  getImageKitAuth,
  uploadImage,
} from "./img-upload/upload-image.service";

export const common: Router = express.Router();

// Server-side image upload route using ImageKit
common.post("/upload", requireAuth, upload.single("image"), uploadImage);

// Get ImageKit authentication parameters for client-side upload
common.get("/upload/auth", requireAuth, getImageKitAuth);
