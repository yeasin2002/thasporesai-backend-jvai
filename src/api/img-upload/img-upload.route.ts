import "./img-upload.openapi";

import { upload } from "@/lib/multer";
import express, { type Router } from "express";
import { uploadImage } from "./services";

export const imgUpload: Router = express.Router();

// Single image upload route using centralized multer config
imgUpload.post("/", upload.single("image"), uploadImage);
