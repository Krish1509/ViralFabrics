# Party API Endpoints Documentation

## Overview
The Party API provides CRUD operations for managing parties in the CRM system. All endpoints require authentication.

## Base URL
```
/api/parties
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. GET /api/parties
Search and retrieve parties with optional search parameter.

**Query Parameters:**
- `search` (optional): Case-insensitive partial match on party name

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Company",
    "contactName": "John Doe",
    "contactPhone": "+1234567890",
    "address": "123 Main St, City, State",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Example Usage:**
```javascript
// Get all parties
const response = await fetch('/api/parties', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Search parties by name
const response = await fetch('/api/parties?search=ABC', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 2. POST /api/parties
Create a new party.

**Request Body:**
```json
{
  "name": "ABC Company",
  "contactName": "John Doe",
  "contactPhone": "+1234567890",
  "address": "123 Main St, City, State"
}
```

**Response (201):**
```json
{
  "message": "Party created successfully",
  "party": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Company",
    "contactName": "John Doe",
    "contactPhone": "+1234567890",
    "address": "123 Main St, City, State",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example Usage:**
```javascript
const response = await fetch('/api/parties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "ABC Company",
    contactName: "John Doe",
    contactPhone: "+1234567890",
    address: "123 Main St, City, State"
  })
});
```

### 3. GET /api/parties/[id]
Get a specific party by ID.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "ABC Company",
  "contactName": "John Doe",
  "contactPhone": "+1234567890",
  "address": "123 Main St, City, State",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response (404):**
```json
{
  "message": "Party not found"
}
```

### 4. PUT /api/parties/[id]
Update a specific party by ID.

**Request Body (partial updates supported):**
```json
{
  "name": "Updated Company Name",
  "contactName": "Jane Smith",
  "contactPhone": "+0987654321",
  "address": "456 Oak Ave, City, State"
}
```

**Response (200):**
```json
{
  "message": "Party updated successfully",
  "party": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Company Name",
    "contactName": "Jane Smith",
    "contactPhone": "+0987654321",
    "address": "456 Oak Ave, City, State",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

### 5. DELETE /api/parties/[id]
Delete a specific party by ID.

**Response (200):**
```json
{
  "message": "Party deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Party name is required, Contact name cannot exceed 50 characters"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Party not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

## Validation Rules

- **name**: Required, 2-100 characters
- **contactName**: Optional, max 50 characters
- **contactPhone**: Optional, max 20 characters
- **address**: Optional, max 200 characters
- **name uniqueness**: Case-insensitive unique constraint

## Features

- ✅ Authentication required for all endpoints
- ✅ Case-insensitive search by name
- ✅ Partial updates supported
- ✅ Comprehensive validation
- ✅ Duplicate name prevention
- ✅ MongoDB error handling
- ✅ Proper HTTP status codes
- ✅ Consistent response format
