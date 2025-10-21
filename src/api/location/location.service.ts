import type {
	CreateLocation,
	UpdateLocation,
} from "@/api/location/location.validation";
import { top50USCities } from "@/data/location-list";
import { db } from "@/db";
import type { RequestHandler } from "express";

// Get all locations
export const getAllLocations: RequestHandler = async (_req, res) => {
	try {
		const locations = await db.location.find().sort({ name: 1 });
		res.status(200).json({
			status: 200,
			message: "Locations fetched successfully",
			data: locations,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Get location by ID
export const getLocationById: RequestHandler<{ id: string }> = async (
	req,
	res,
) => {
	try {
		const { id } = req.params;
		const location = await db.location.findById(id);

		if (!location) {
			return res.status(404).json({
				status: 404,
				message: "Location not found",
				data: null,
			});
		}

		res.status(200).json({
			status: 200,
			message: "Location fetched successfully",
			data: location,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Create location
export const createLocation: RequestHandler<{}, any, CreateLocation> = async (
	req,
	res,
) => {
	try {
		// Check if location already exists
		const existingLocation = await db.location.findOne({
			name: req.body.name,
			state: req.body.state,
		});

		if (existingLocation) {
			return res.status(400).json({
				status: 400,
				message: "Location already exists",
				data: null,
			});
		}

		const location = await db.location.create(req.body);

		res.status(201).json({
			status: 201,
			message: "Location created successfully",
			data: location,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
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
			return res.status(404).json({
				status: 404,
				message: "Location not found",
				data: null,
			});
		}

		const location = await db.location.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			status: 200,
			message: "Location updated successfully",
			data: location,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Delete location
export const deleteLocation: RequestHandler<{ id: string }> = async (
	req,
	res,
) => {
	try {
		const { id } = req.params;

		const location = await db.location.findByIdAndDelete(id);

		if (!location) {
			return res.status(404).json({
				status: 404,
				message: "Location not found",
				data: null,
			});
		}

		res.status(200).json({
			status: 200,
			message: "Location deleted successfully",
			data: location,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

// Seed locations with top 50 US cities
export const seedLocations: RequestHandler = async (_req, res) => {
	try {
		// Check if locations already exist
		const existingCount = await db.location.countDocuments();
		if (existingCount > 0) {
			return res.status(400).json({
				status: 400,
				message: `Database already contains ${existingCount} locations. Clear the collection first if you want to reseed.`,
				data: null,
			});
		}

		// Insert all cities
		const locations = await db.location.insertMany(top50USCities);

		res.status(201).json({
			status: 201,
			message: `Successfully seeded ${locations.length} locations`,
			data: locations,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};
