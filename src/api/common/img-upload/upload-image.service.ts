import { sendError, sendSuccess } from "@/helpers";
import { API_BASE_URL, getFileUrl, logError, logger } from "@/lib";
import type { RequestHandler } from "express";

/**
 * Upload image handler
 * Accepts a single image file and returns the URL
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
      savedPath: req.file.path,
    });

    // Get the base URL from environment or request
    const baseUrl = API_BASE_URL || `${req.protocol}://${req.get("host")}`;

    // Get the file URL using helper function
    const relativeUrl = getFileUrl(req.file.filename);
    const imageUrl = `${baseUrl}${relativeUrl}`;
    const image_details = {
      url: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    logger.info("Image uploaded successfully", {
      userId: (req as any).user?.id,
      filename: req.file.filename,
      url: imageUrl,
      size: req.file.size,
    });

    return sendSuccess(res, 200, "Image uploaded successfully", image_details);
  } catch (error) {
    logError("Image upload failed", error, {
      userId: (req as any).user?.id,
      filename: req.file?.originalname,
      size: req.file?.size,
    });
    return sendError(res, 500, "Failed to upload image");
  }
};
