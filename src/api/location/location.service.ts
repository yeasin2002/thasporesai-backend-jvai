import type {
	CreateLocation,
	UpdateLocation,
} from "@/api/location/location.validation";
import { top50USCities } from "@/data/location-list";
import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { RequestHandler } from "express";

// Get all locations
export const getAllLocations: RequestHandler = async (_req, res) => {
  try {
    const locations = await db.location
      .find()
      .sort({ name: 1 })
      .select("-__v -createdAt -updatedAt");
    return sendSuccess(res, 200, "Locations fetched successfully", locations);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Get location by ID
export const getLocationById: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const location = await db.location
      .findById(id)
      .select("-__v -createdAt -updatedAt");

    if (!location) {
      return sendError(res, 404, "Location not found");
    }

    return sendSuccess(res, 200, "Location fetched successfully", location);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Create location
export const createLocation: RequestHandler<{}, any, CreateLocation> = async (
  req,
  res
) => {
  try {
    // Check if location already exists
    const existingLocation = await db.location.findOne({
      name: req.body.name,
      state: req.body.state,
    });

    if (existingLocation) {
      return sendError(res, 400, "Location already exists");
    }

    const location = await db.location.create(req.body);

    return sendSuccess(res, 201, "Location created successfully", location);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Update location
export const updateLocation: RequestHandler<
  { id: string },
  any,
  UpdateLocation
> = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if location exists
    const existingLocation = await db.location.findById(id);
    if (!existingLocation) {
      return sendError(res, 404, "Location not found");
    }

    const location = await db.location.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, "Location updated successfully", location);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Delete location
export const deleteLocation: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const location = await db.location.findByIdAndDelete(id);

    if (!location) {
      return sendError(res, 404, "Location not found");
    }

    return sendSuccess(res, 200, "Location deleted successfully", location);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Seed locations with top 50 US cities
export const seedLocations: RequestHandler = async (_req, res) => {
  try {
    // Check if locations already exist
    const existingCount = await db.location.countDocuments();
    if (existingCount > 0) {
      return sendError(
        res,
        400,
        `Database already contains ${existingCount} locations. Clear the collection first if you want to reseed.`
      );
    }

    // Insert all cities
    const locations = await db.location.insertMany(top50USCities);

    return sendSuccess(
      res,
      201,
      `Successfully seeded ${locations.length} locations`,
      locations
    );
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};
