import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		// Store in uploads folder at project root
		const uploadPath = path.join(__dirname, "../../uploads");
		cb(null, uploadPath);
	},
	filename: (_req, file, cb) => {
		// Generate unique filename: timestamp-randomstring-originalname
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const ext = path.extname(file.originalname);
		const nameWithoutExt = path.basename(file.originalname, ext);
		cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
	},
});

// File filter for images only
const fileFilter = (
	_req: Express.Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	// Accept images only
	const allowedMimes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	];

	if (allowedMimes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
			),
		);
	}
};

// Create multer instance
export const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB max file size
	},
});

// Helper function to get file URL
export function getFileUrl(filename: string): string {
	return `/uploads/${filename}`;
}

// Helper function to delete file
export async function deleteFile(filename: string): Promise<void> {
	const fs = await import("node:fs/promises");
	const filePath = path.join(__dirname, "../../uploads", filename);

	try {
		await fs.unlink(filePath);
	} catch (error) {
		console.error("Error deleting file:", error);
	}
}
