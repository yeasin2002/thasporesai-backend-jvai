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
    iconFile: "Plumbing.svg",
  },
  {
    name: "Cleaning",
    description:
      "Professional cleaning services for homes, offices, and commercial spaces including deep cleaning",
    iconFile: "Cleaning.svg",
  },
  {
    name: "Electrical",
    description:
      "Licensed electricians for wiring, repairs, installations, and electrical system maintenance",
    iconFile: "Electrical.svg",
  },
  {
    name: "Carpentry",
    description:
      "Skilled carpenters for furniture making, repairs, custom woodwork, and carpentry services",
    iconFile: "Carpentry.svg",
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

    const categoriesToInsert = seedCategoryData.map((category) => {
      return {
        name: category.name,
        description: category.description,
        icon: category.iconFile,
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
