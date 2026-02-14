import multer from "multer";
import fs from "node:fs";
import path from "node:path";

// Get project root directory (works in both dev and production)
const projectRoot = process.cwd();
const uploadsDir = path.join(projectRoot, "uploads");

// Ensure uploads directory exists (for backward compatibility if needed)
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure memory storage for ImageKit uploads
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  // Also check file extension as fallback (some browsers send wrong MIME types)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed. Received: ${file.mimetype}`
      )
    );
  }
};

// Create multer instance with memory storage for ImageKit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Helper function to get file URL (deprecated - kept for backward compatibility)
export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

// Helper function to delete file (deprecated - kept for backward compatibility)
export async function deleteFile(filename: string): Promise<void> {
  const fsPromises = await import("node:fs/promises");
  const filePath = path.join(uploadsDir, filename);

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
