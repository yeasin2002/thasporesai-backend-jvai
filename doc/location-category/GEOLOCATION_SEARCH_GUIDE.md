# Geolocation-Based Search Implementation Guide

How to add "nearby locations" search functionality to the Location API.

---

## Overview

Enable users to find locations within a certain radius of their current position using MongoDB's geospatial queries.

**Example Use Case**: "Find all service locations within 50km of my current location"

---

## Step 1: Update Database Model

### Add Geospatial Index

**File**: `src/db/models/location.model.ts`

```typescript
import { Schema, model, type Document } from "mongoose";

export interface Location {
  name: string;
  state: string;
  coordinates: { lat: number; lng: number };
}

export interface LocationDocument extends Location, Document {}

const locationSchema = new Schema<LocationDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

// ✅ ADD THIS: Create 2dsphere index for geospatial queries
locationSchema.index({
  coordinates: "2dsphere",
});

export const Location = model<LocationDocument>("location", locationSchema);
```

**Why 2dsphere?**

- Supports queries on Earth-like spheres
- Handles latitude/longitude coordinates
- Enables `$near`, `$geoWithin`, `$geoNear` queries

---

## Step 2: Update Validation Schema

**File**: `src/api/location/location.validation.ts`

Add geolocation query parameters:

```typescript
// Add this after LocationQuerySchema
export const LocationNearbyQuerySchema = PaginationQuerySchema.extend({
  lat: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, "Invalid latitude")
    .transform(Number)
    .refine(
      (val) => val >= -90 && val <= 90,
      "Latitude must be between -90 and 90"
    )
    .openapi({ description: "User's latitude" }),
  lng: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, "Invalid longitude")
    .transform(Number)
    .refine(
      (val) => val >= -180 && val <= 180,
      "Longitude must be between -180 and 180"
    )
    .openapi({ description: "User's longitude" }),
  radius: z
    .string()
    .regex(/^\d+$/, "Invalid radius")
    .transform(Number)
    .default("50")
    .openapi({ description: "Search radius in kilometers (default: 50)" }),
  unit: z
    .enum(["km", "miles"])
    .default("km")
    .openapi({ description: "Distance unit (km or miles)" }),
}).openapi("LocationNearbyQuery");

// Export type
export type LocationNearbyQuery = z.infer<typeof LocationNearbyQuerySchema>;
```

---

## Step 3: Create Nearby Service

**File**: `src/api/location/services/get-nearby-locations.service.ts`

```typescript
import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers/response-handler";
import type { Request, RequestHandler, Response } from "express";

// Get nearby locations using geospatial query
export const getNearbyLocations: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      lat,
      lng,
      radius = 50,
      unit = "km",
      page = "1",
      limit = "10",
    } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return sendError(res, 400, "Latitude and longitude are required");
    }

    // Convert to numbers
    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusNum = Number(radius);
    const pageNum = Number.parseInt(page as string, 10);
    const limitNum = Number.parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Convert radius to meters (MongoDB uses meters)
    const radiusInMeters =
      unit === "miles"
        ? radiusNum * 1609.34 // 1 mile = 1609.34 meters
        : radiusNum * 1000; // 1 km = 1000 meters

    // Build geospatial query
    // MongoDB expects [longitude, latitude] order (GeoJSON format)
    const geoQuery = {
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // [lng, lat] order!
          },
          $maxDistance: radiusInMeters,
        },
      },
    };

    // Get total count (Note: $near doesn't work with countDocuments)
    // We need to use $geoWithin for counting
    const countQuery = {
      coordinates: {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            radiusInMeters / 6378100, // Earth's radius in meters
          ],
        },
      },
    };
    const total = await db.location.countDocuments(countQuery);

    // Get nearby locations with pagination
    // Note: $near automatically sorts by distance (closest first)
    const locations = await db.location
      .find(geoQuery)
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .lean();

    // Calculate distance for each location (optional)
    const locationsWithDistance = locations.map((location: any) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        location.coordinates.lat,
        location.coordinates.lng,
        unit as "km" | "miles"
      );
      return {
        ...location,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimals
        unit,
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(res, 200, "Nearby locations fetched successfully", {
      locations: locationsWithDistance,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      searchCenter: { lat: latitude, lng: longitude },
      radius: radiusNum,
      unit,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Internal Server Error");
  }
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "km" | "miles" = "km"
): number {
  const R = unit === "miles" ? 3959 : 6371; // Earth's radius in miles or km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

---

## Step 4: Update Service Index

**File**: `src/api/location/services/index.ts`

```typescript
export * from "./al-locations.service";
export * from "./create-location.service";
export * from "./delete-location.service";
export * from "./get-location-by-id.service";
export * from "./update-location.service";
export * from "./get-nearby-locations.service"; // ✅ ADD THIS
```

---

## Step 5: Add Route

**File**: `src/api/location/location.route.ts`

```typescript
import "./location.openapi";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation.middleware";
import express, { type Router } from "express";
import {
  CreateLocationSchema,
  LocationIdSchema,
  LocationNearbyQuerySchema, // ✅ ADD THIS
  LocationQuerySchema,
  UpdateLocationSchema,
} from "./location.validation";
import {
  createLocation,
  deleteLocation,
  getAllLocations,
  getLocationById,
  getNearbyLocations, // ✅ ADD THIS
  updateLocation,
} from "./services";

export const location: Router = express.Router();

location
  .get("/", validateQuery(LocationQuerySchema), getAllLocations)
  .get("/nearby", validateQuery(LocationNearbyQuerySchema), getNearbyLocations) // ✅ ADD THIS
  .get("/:id", validateParams(LocationIdSchema), getLocationById)
  .post("/", validateBody(CreateLocationSchema), createLocation)
  .put(
    "/:id",
    validateParams(LocationIdSchema),
    validateBody(UpdateLocationSchema),
    updateLocation
  )
  .delete("/:id", validateParams(LocationIdSchema), deleteLocation);
```

**⚠️ Important**: Place `/nearby` route BEFORE `/:id` to avoid conflicts!

---

## Step 6: Update OpenAPI Documentation

**File**: `src/api/location/location.openapi.ts`

```typescript
import { openAPITags } from "@/common/constants/api-route-tags";
import { registry } from "@/lib/openapi";
import {
  CreateLocationSchema,
  ErrorResponseSchema,
  LocationIdSchema,
  LocationNearbyQuerySchema, // ✅ ADD THIS
  LocationQuerySchema,
  LocationResponseSchema,
  LocationsResponseSchema,
  UpdateLocationSchema,
} from "./location.validation";

// Register schemas
registry.register("LocationNearbyQuery", LocationNearbyQuerySchema); // ✅ ADD THIS

// ... existing registrations ...

// ✅ ADD THIS: GET /api/location/nearby - Get nearby locations
registry.registerPath({
  method: "get",
  path: `${openAPITags.location.basepath}/nearby`,
  description: "Get locations within a specified radius of given coordinates",
  summary: "Find nearby locations",
  tags: [openAPITags.location.name],
  request: {
    query: LocationNearbyQuerySchema,
  },
  responses: {
    200: {
      description: "Nearby locations retrieved successfully",
      content: {
        "application/json": {
          schema: LocationsResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid coordinates or parameters",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
```

---

## Step 7: Create Geospatial Index (One-Time Setup)

Run this in MongoDB shell or create a migration script:

```javascript
// MongoDB shell command
db.locations.createIndex({ coordinates: "2dsphere" });
```

Or use Mongoose to create it automatically (already done in Step 1).

---

## Usage Examples

### API Request

```http
# Find locations within 50km of New York City
GET /api/location/nearby?lat=40.7128&lng=-74.0060&radius=50&unit=km

# Find locations within 25 miles
GET /api/location/nearby?lat=40.7128&lng=-74.0060&radius=25&unit=miles

# With pagination
GET /api/location/nearby?lat=40.7128&lng=-74.0060&radius=50&page=1&limit=10
```

### Response

```json
{
  "status": 200,
  "message": "Nearby locations fetched successfully",
  "success": true,
  "data": {
    "locations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Manhattan",
        "state": "NY",
        "coordinates": {
          "lat": 40.7831,
          "lng": -73.9712
        },
        "distance": 8.5,
        "unit": "km"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Brooklyn",
        "state": "NY",
        "coordinates": {
          "lat": 40.6782,
          "lng": -73.9442
        },
        "distance": 12.3,
        "unit": "km"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "searchCenter": {
      "lat": 40.7128,
      "lng": -74.006
    },
    "radius": 50,
    "unit": "km"
  }
}
```

---

## Frontend Integration

### React/TypeScript

```typescript
interface NearbyLocationsParams {
  lat: number;
  lng: number;
  radius?: number;
  unit?: "km" | "miles";
  page?: number;
  limit?: number;
}

const fetchNearbyLocations = async ({
  lat,
  lng,
  radius = 50,
  unit = "km",
  page = 1,
  limit = 10,
}: NearbyLocationsParams) => {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
    unit,
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`/api/location/nearby?${params}`);
  const json = await response.json();

  return json.data;
};

// Usage with browser geolocation
navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;

  const data = await fetchNearbyLocations({
    lat: latitude,
    lng: longitude,
    radius: 25,
    unit: "km",
  });

  console.log(`Found ${data.total} locations within 25km`);
  data.locations.forEach((loc) => {
    console.log(`${loc.name} - ${loc.distance}${loc.unit} away`);
  });
});
```

### Flutter

```dart
class NearbyLocationsParams {
  final double lat;
  final double lng;
  final int radius;
  final String unit;
  final int page;
  final int limit;

  NearbyLocationsParams({
    required this.lat,
    required this.lng,
    this.radius = 50,
    this.unit = 'km',
    this.page = 1,
    this.limit = 10,
  });
}

Future<Map<String, dynamic>> fetchNearbyLocations(
  NearbyLocationsParams params,
) async {
  final queryParams = {
    'lat': params.lat.toString(),
    'lng': params.lng.toString(),
    'radius': params.radius.toString(),
    'unit': params.unit,
    'page': params.page.toString(),
    'limit': params.limit.toString(),
  };

  final uri = Uri.parse('$baseUrl/api/location/nearby')
      .replace(queryParameters: queryParams);

  final response = await http.get(uri);
  final json = jsonDecode(response.body);

  if (json['status'] == 200) {
    return json['data'];
  }

  throw Exception(json['message']);
}

// Usage with device location
Position position = await Geolocator.getCurrentPosition();

final data = await fetchNearbyLocations(
  NearbyLocationsParams(
    lat: position.latitude,
    lng: position.longitude,
    radius: 25,
    unit: 'km',
  ),
);

print('Found ${data['total']} locations within 25km');
```

---

## Testing

### Test File: `location-nearby.http`

```http
### Find locations near New York City (50km)
GET http://localhost:4000/api/location/nearby?lat=40.7128&lng=-74.0060&radius=50&unit=km

### Find locations near Los Angeles (25 miles)
GET http://localhost:4000/api/location/nearby?lat=34.0522&lng=-118.2437&radius=25&unit=miles

### With pagination
GET http://localhost:4000/api/location/nearby?lat=40.7128&lng=-74.0060&radius=50&page=1&limit=5

### Invalid coordinates (should return 400)
GET http://localhost:4000/api/location/nearby?lat=invalid&lng=-74.0060

### Missing coordinates (should return 400)
GET http://localhost:4000/api/location/nearby?radius=50
```

---

## Performance Considerations

### Index Performance

✅ **2dsphere index** enables fast geospatial queries  
✅ **Automatic sorting** by distance (no need for manual sorting)  
✅ **Efficient radius queries** using MongoDB's optimized algorithms

### Optimization Tips

1. **Limit radius**: Don't allow searches > 500km to prevent slow queries
2. **Use pagination**: Always paginate results for large datasets
3. **Cache results**: Cache frequently searched coordinates
4. **Index compound fields**: If filtering by other fields, create compound indexes

```typescript
// Example: Index for geolocation + state filtering
locationSchema.index({ coordinates: "2dsphere", state: 1 });
```

---

## Common Issues & Solutions

### Issue 1: "Can't use $near with $or"

**Problem**: MongoDB doesn't support `$near` with `$or` queries.

**Solution**: Use `$geoWithin` instead of `$near` when combining with other queries.

### Issue 2: Wrong coordinate order

**Problem**: MongoDB uses [longitude, latitude] order (GeoJSON format).

**Solution**: Always use `[lng, lat]` order in queries:

```typescript
coordinates: [longitude, latitude]; // ✅ Correct
coordinates: [latitude, longitude]; // ❌ Wrong
```

### Issue 3: Distance calculation mismatch

**Problem**: MongoDB calculates distance differently than Haversine formula.

**Solution**: Use MongoDB's `$geoNear` aggregation for accurate distances:

```typescript
const locations = await db.location.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [longitude, latitude] },
      distanceField: "distance",
      maxDistance: radiusInMeters,
      spherical: true,
    },
  },
  { $skip: skip },
  { $limit: limitNum },
]);
```

---

## Advanced Features (Optional)

### 1. Filter by State + Nearby

```typescript
const geoQuery = {
  coordinates: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      $maxDistance: radiusInMeters,
    },
  },
  state: "NY", // ✅ Add state filter
};
```

### 2. Sort by Distance + Name

```typescript
const locations = await db.location.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [longitude, latitude] },
      distanceField: "distance",
      maxDistance: radiusInMeters,
      spherical: true,
    },
  },
  { $sort: { distance: 1, name: 1 } }, // Sort by distance, then name
  { $skip: skip },
  { $limit: limitNum },
]);
```

### 3. Polygon-Based Search

Instead of radius, search within a polygon (e.g., city boundaries):

```typescript
const polygonQuery = {
  coordinates: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-74.0, 40.7],
            [-73.9, 40.7],
            [-73.9, 40.8],
            [-74.0, 40.8],
            [-74.0, 40.7], // Close the polygon
          ],
        ],
      },
    },
  },
};
```

---

## Summary

✅ **Step 1**: Add 2dsphere index to location model  
✅ **Step 2**: Create validation schema with lat/lng/radius  
✅ **Step 3**: Implement nearby service with geospatial query  
✅ **Step 4**: Export service  
✅ **Step 5**: Add route (before /:id route)  
✅ **Step 6**: Update OpenAPI documentation  
✅ **Step 7**: Create geospatial index in database

**Result**: Users can now find locations within a specified radius of their current position, sorted by distance!

---

## References

- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [Mongoose Geospatial Indexes](https://mongoosejs.com/docs/geojson.html)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
