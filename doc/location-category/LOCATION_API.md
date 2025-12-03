# Location API - Frontend Guide

Quick reference for integrating the Location API with pagination and search.

---

## Base URL

```
/api/location
```

---

## Get All Locations

**GET** `/api/location`

### Query Parameters (all optional)

| Parameter | Type   | Default | Description             |
| --------- | ------ | ------- | ----------------------- |
| `search`  | string | -       | Search by location name |
| `page`    | number | 1       | Page number             |
| `limit`   | number | 10      | Items per page          |

### Examples

```http
# Get all locations (default pagination)
GET /api/location

# Search by name
GET /api/location?search=New

# Custom pagination
GET /api/location?page=2&limit=20

# Search with pagination
GET /api/location?search=Los&page=1&limit=5
```

### Response

```json
{
  "status": 200,
  "message": "Locations fetched successfully",
  "success": true,
  "data": {
    "locations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "New York",
        "state": "NY",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.006
        }
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## Migration Guide

### ⚠️ Breaking Change

The response structure has changed:

**Before**:

```json
{
  "data": [
    /* array of locations */
  ]
}
```

**After**:

```json
{
  "data": {
    "locations": [
      /* array */
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## Code Examples

### React/TypeScript

```typescript
interface Location {
  _id: string;
  name: string;
  state: string;
  coordinates: { lat: number; lng: number };
}

interface LocationsData {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fetchLocations = async (
  search?: string,
  page = 1,
  limit = 10
): Promise<LocationsData> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append("search", search);

  const response = await fetch(`/api/location?${params}`);
  const json = await response.json();

  return json.data; // { locations, total, page, limit, totalPages }
};

// Usage
const { locations, total, totalPages } = await fetchLocations("New", 1, 10);
```

### Flutter

```dart
class LocationsData {
  final List<Location> locations;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  LocationsData({
    required this.locations,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory LocationsData.fromJson(Map<String, dynamic> json) {
    return LocationsData(
      locations: (json['locations'] as List)
          .map((e) => Location.fromJson(e))
          .toList(),
      total: json['total'],
      page: json['page'],
      limit: json['limit'],
      totalPages: json['totalPages'],
    );
  }
}

Future<LocationsData> fetchLocations({
  String? search,
  int page = 1,
  int limit = 10,
}) async {
  final queryParams = {
    'page': page.toString(),
    'limit': limit.toString(),
  };

  if (search != null && search.isNotEmpty) {
    queryParams['search'] = search;
  }

  final uri = Uri.parse('$baseUrl/api/location')
      .replace(queryParameters: queryParams);

  final response = await http.get(uri);
  final json = jsonDecode(response.body);

  if (json['status'] == 200) {
    return LocationsData.fromJson(json['data']);
  }

  throw Exception(json['message']);
}

// Usage
final data = await fetchLocations(search: 'New', page: 1, limit: 10);
print('Total: ${data.total}, Pages: ${data.totalPages}');
```

### JavaScript (Vanilla)

```javascript
async function fetchLocations(search = "", page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append("search", search);

  const response = await fetch(`/api/location?${params}`);
  const json = await response.json();

  return json.data; // { locations, total, page, limit, totalPages }
}

// Usage
const { locations, total, totalPages } = await fetchLocations("New", 1, 10);
```

---

## Update Your Code

### Before

```typescript
// Old code
const response = await fetch("/api/location");
const { data } = await response.json();
const locations = data; // ❌ This will break
```

### After

```typescript
// New code
const response = await fetch("/api/location");
const { data } = await response.json();
const { locations, total, totalPages } = data; // ✅ Correct
```

---

## Other Endpoints (Unchanged)

### Get Location by ID

```http
GET /api/location/:id
```

### Create Location

```http
POST /api/location
Content-Type: application/json

{
  "name": "New York",
  "state": "NY",
  "coordinates": { "lat": 40.7128, "lng": -74.0060 }
}
```

### Update Location

```http
PUT /api/location/:id
Content-Type: application/json

{
  "name": "New York City"
}
```

### Delete Location

```http
DELETE /api/location/:id
```

---

## Error Responses

```json
{
  "status": 400,
  "message": "Error description",
  "data": null,
  "success": false
}
```

**Status Codes**:

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
