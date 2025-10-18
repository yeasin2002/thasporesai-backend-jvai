import { db } from "@/db";
import { deleteFile, getFileUrl } from "@/lib/multer";
import type { RequestHandler } from "express";
import type {
  CreateCategory,
  SearchCategory,
  UpdateCategory,
} from "./category.validation";

// Get All Categories (with search and pagination)
export const getAllCategories: RequestHandler<
  unknown,
  unknown,
  unknown,
  SearchCategory
> = async (req, res) => {
  try {
    const { search, page = "1", limit = "10" } = req.query;

    const pageNum = Number.parseInt(page, 10);
    const limitNum = Number.parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get categories with pagination
    const [categories, total] = await Promise.all([
      db.category.find(query).skip(skip).limit(limitNum).sort({ name: 1 }),
      db.category.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      status: 200,
      message: search
        ? `Found ${categories.length} categories matching "${search}"`
        : "Categories retrieved successfully",
      data: {
        categories,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Get Category by ID
export const getCategoryById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await db.category.findById(id);

    if (!category) {
      return res.status(404).json({
        status: 404,
        message: "Category not found",
        data: null,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Create Category (Admin only)
export const createCategory: RequestHandler<
  unknown,
  unknown,
  CreateCategory
> = async (req, res) => {
  try {
    const { name, description } = req.body;
    const file = req.file;

    // Check if file was uploaded
    if (!file) {
      return res.status(400).json({
        status: 400,
        message: "Category icon image is required",
        data: null,
      });
    }

    // Check if category with same name already exists
    const existingCategory = await db.category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      // Delete uploaded file if category already exists
      await deleteFile(file.filename);

      return res.status(400).json({
        status: 400,
        message: "Category with this name already exists",
        data: null,
      });
    }

    // Get file URL
    const iconUrl = getFileUrl(file.filename);

    // Create category
    const category = await db.category.create({
      name,
      icon: iconUrl,
      description,
    });

    res.status(201).json({
      status: 201,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    // Delete uploaded file if error occurs
    if (req.file) {
      await deleteFile(req.file.filename);
    }

    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Update Category (Admin only)
export const updateCategory: RequestHandler<
  { id: string },
  unknown,
  UpdateCategory
> = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const file = req.file;

    // Check if category exists
    const category = await db.category.findById(id);
    if (!category) {
      // Delete uploaded file if category not found
      if (file) {
        await deleteFile(file.filename);
      }

      return res.status(404).json({
        status: 404,
        message: "Category not found",
        data: null,
      });
    }

    // If updating name, check for duplicates
    if (updates.name) {
      const existingCategory = await db.category.findOne({
        name: { $regex: new RegExp(`^${updates.name}$`, "i") },
        _id: { $ne: id },
      });

      if (existingCategory) {
        // Delete uploaded file if duplicate name
        if (file) {
          await deleteFile(file.filename);
        }

        return res.status(400).json({
          status: 400,
          message: "Category with this name already exists",
          data: null,
        });
      }
    }

    // Prepare update object
    const updateData: any = { ...updates };

    // If new icon uploaded, delete old icon and update with new one
    if (file) {
      // Extract filename from old icon URL
      const oldIconFilename = category.icon.split("/").pop();
      if (oldIconFilename) {
        await deleteFile(oldIconFilename);
      }

      // Add new icon URL to updates
      updateData.icon = getFileUrl(file.filename);
    }

    // Update category
    const updatedCategory = await db.category.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 200,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update category error:", error);

    // Delete uploaded file if error occurs
    if (req.file) {
      await deleteFile(req.file.filename);
    }

    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Delete Category (Admin only)
export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await db.category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        status: 404,
        message: "Category not found",
        data: null,
      });
    }

    // Delete icon file
    const iconFilename = category.icon.split("/").pop();
    if (iconFilename) {
      await deleteFile(iconFilename);
    }

    res.status(200).json({
      status: 200,
      message: "Category deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: null,
    });
  }
};
