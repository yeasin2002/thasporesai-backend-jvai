import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { RequestHandler } from "express";
import fs from "node:fs";
import path from "node:path";

const seedCategoryData = [
  {
    name: "Plumbing",
    description:
      "Professional plumbing services including repairs, installations, and maintenance for residential and commercial properties",
    iconFile: "1.png",
  },
  {
    name: "Cleaning",
    description:
      "Professional cleaning services for homes, offices, and commercial spaces including deep cleaning",
    iconFile: "2.png",
  },
  {
    name: "Electrical",
    description:
      "Licensed electricians for wiring, repairs, installations, and electrical system maintenance",
    iconFile: "3.png",
  },
  {
    name: "Carpentry",
    description:
      "Skilled carpenters for furniture making, repairs, custom woodwork, and carpentry services",
    iconFile: "4.png",
  },
];

export const seedCategories: RequestHandler = async (_req, res) => {
  try {
    // Check if categories already exist
    const existingCount = await db.category.countDocuments();
    if (existingCount > 0) {
      return sendError(
        res,
        400,
        `Database already contains ${existingCount} categories. Clear the collection first if you want to reseed.`
      );
    }

    // Copy icon files to uploads folder and prepare category data
    const uploadDir = path.join(process.cwd(), "uploads", "categories");

    // Create uploads/categories directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const categoriesToInsert = seedCategoryData.map((category) => {
      const sourceFile = path.join(
        process.cwd(),
        "src",
        "api",
        "seed",
        "assets",
        category.iconFile
      );
      const destFile = path.join(uploadDir, category.iconFile);

      // Copy icon file to uploads folder
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
      }

      return {
        name: category.name,
        description: category.description,
        icon: `/uploads/categories/${category.iconFile}`,
      };
    });

    // Insert all categories
    const categories = await db.category.insertMany(categoriesToInsert);

    return sendSuccess(
      res,
      201,
      `Successfully seeded ${categories.length} categories`,
      categories
    );
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};
