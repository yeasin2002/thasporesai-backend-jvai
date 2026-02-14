import { sendError, sendSuccess } from "@/helpers";
import { imagekit, logError, logger } from "@/lib";
import type { RequestHandler } from "express";

/**
 * Upload image handler using ImageKit
 * Accepts a single image file and uploads it to ImageKit
 */
export const uploadImage: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      logError(
        "No image file provided in upload request",
        new Error("Missing file"),
        {
          userId: (req as any).user?.id,
          url: req.originalUrl,
        }
      );
      return sendError(res, 400, "No image file provided");
    }

    logger.info("Image upload started", {
      userId: (req as any).user?.id,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer, // File buffer from multer memory storage
      fileName: req.file.originalname,
      folder: "/uploads", // Optional: organize files in folders
      useUniqueFileName: true, // Generate unique filename
      tags: ["user-upload"], // Optional: add tags for organization
    });

    const imageDetails = {
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      filename: uploadResponse.name,
      originalName: req.file.originalname,
      size: uploadResponse.size,
      mimetype: req.file.mimetype,
      thumbnailUrl: uploadResponse.thumbnailUrl,
      filePath: uploadResponse.filePath,
    };

    logger.info("Image uploaded successfully to ImageKit", {
      userId: (req as any).user?.id,
      fileId: uploadResponse.fileId,
      url: uploadResponse.url,
      size: uploadResponse.size,
    });

    return sendSuccess(res, 200, "Image uploaded successfully", imageDetails);
  } catch (error) {
    logError("Image upload to ImageKit failed", error, {
      userId: (req as any).user?.id,
      filename: req.file?.originalname,
      size: req.file?.size,
    });
    return sendError(res, 500, "Failed to upload image");
  }
};

/**
 * Get ImageKit authentication parameters for client-side upload
 * Frontend will use these parameters to upload directly to ImageKit
 */
export const getImageKitAuth: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    logger.info("ImageKit auth parameters requested", {
      userId,
      url: req.originalUrl,
    });

    // Generate authentication parameters
    const authParams = imagekit.getAuthenticationParameters();

    logger.info("ImageKit auth parameters generated", {
      userId,
      expire: authParams.expire,
    });

    return sendSuccess(
      res,
      200,
      "Authentication parameters generated successfully",
      {
        token: authParams.token,
        expire: authParams.expire,
        signature: authParams.signature,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      }
    );
  } catch (error) {
    logError("Failed to generate ImageKit auth parameters", error, {
      userId: (req as any).user?.id,
    });
    return sendError(res, 500, "Failed to generate authentication parameters");
  }
};
