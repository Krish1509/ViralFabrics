# Orders API Endpoints Documentation

## Overview
The Orders API provides comprehensive CRUD operations for managing orders in the CRM system. All endpoints require authentication and include advanced filtering, pagination, and duplicate prevention.

## Base URL
```
/api/orders
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. GET /api/orders
Search and retrieve orders with advanced filtering and pagination.

**Query Parameters:**
- `party` (optional): Party ID to filter orders by specific party
- `startDate` (optional): Start date for arrival date range (ISO format)
- `endDate` (optional): End date for arrival date range (ISO format)
- `styleNo` (optional): Case-insensitive partial match on style number
- `poNumber` (optional): Case-insensitive partial match on PO number
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20, max: 100)

**Response (200):**
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-0001",
      "orderType": "Bulk",
      "arrivalDate": "2024-01-15T10:30:00.000Z",
      "party": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "ABC Company",
        "contactName": "John Doe",
        "contactPhone": "+1234567890",
        "address": "123 Main St, City, State"
      },
      "contactName": "Jane Smith",
      "contactPhone": "+0987654321",
      "poNumber": "PO-2024-001",
      "styleNo": "STYLE-001",
      "poDate": "2024-01-10T00:00:00.000Z",
      "deliveryDate": "2024-02-15T00:00:00.000Z",
      "quality": "Premium Cotton",
      "quantity": 1000,
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Example Usage:**
```javascript
// Get all orders with pagination
const response = await fetch('/api/orders?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Filter by party
const response = await fetch('/api/orders?party=507f1f77bcf86cd799439012', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Filter by date range
const response = await fetch('/api/orders?startDate=2024-01-01&endDate=2024-01-31', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Search by style number
const response = await fetch('/api/orders?styleNo=STYLE-001', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Complex filtering
const response = await fetch('/api/orders?party=507f1f77bcf86cd799439012&startDate=2024-01-01&poNumber=PO-2024&page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 2. POST /api/orders
Create a new order with automatic orderId generation.

**Request Body:**
```json
{
  "orderType": "Bulk",
  "arrivalDate": "2024-01-15T10:30:00.000Z",
  "party": "507f1f77bcf86cd799439012",
  "contactName": "Jane Smith",
  "contactPhone": "+0987654321",
  "poNumber": "PO-2024-001",
  "styleNo": "STYLE-001",
  "poDate": "2024-01-10T00:00:00.000Z",
  "deliveryDate": "2024-02-15T00:00:00.000Z",
  "quality": "Premium Cotton",
  "quantity": 1000,
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderId": "ORD-0001",
    "orderType": "Bulk",
    "arrivalDate": "2024-01-15T10:30:00.000Z",
    "party": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC Company",
      "contactName": "John Doe",
      "contactPhone": "+1234567890",
      "address": "123 Main St, City, State"
    },
    "contactName": "Jane Smith",
    "contactPhone": "+0987654321",
    "poNumber": "PO-2024-001",
    "styleNo": "STYLE-001",
    "poDate": "2024-01-10T00:00:00.000Z",
    "deliveryDate": "2024-02-15T00:00:00.000Z",
    "quality": "Premium Cotton",
    "quantity": 1000,
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example Usage:**
```javascript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderType: "Bulk",
    arrivalDate: "2024-01-15T10:30:00.000Z",
    party: "507f1f77bcf86cd799439012",
    contactName: "Jane Smith",
    poNumber: "PO-2024-001",
    styleNo: "STYLE-001",
    quantity: 1000
  })
});
```

### 3. GET /api/orders/[id]
Get a specific order by ID with populated party data.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "orderId": "ORD-0001",
  "orderType": "Bulk",
  "arrivalDate": "2024-01-15T10:30:00.000Z",
  "party": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "ABC Company",
    "contactName": "John Doe",
    "contactPhone": "+1234567890",
    "address": "123 Main St, City, State"
  },
  "contactName": "Jane Smith",
  "contactPhone": "+0987654321",
  "poNumber": "PO-2024-001",
  "styleNo": "STYLE-001",
  "poDate": "2024-01-10T00:00:00.000Z",
  "deliveryDate": "2024-02-15T00:00:00.000Z",
  "quality": "Premium Cotton",
  "quantity": 1000,
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 4. PUT /api/orders/[id]
Update a specific order by ID (supports partial updates).

**Request Body (partial updates supported):**
```json
{
  "orderType": "Sample",
  "quantity": 500,
  "deliveryDate": "2024-02-20T00:00:00.000Z"
}
```

**Response (200):**
```json
{
  "message": "Order updated successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderId": "ORD-0001",
    "orderType": "Sample",
    "arrivalDate": "2024-01-15T10:30:00.000Z",
    "party": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC Company",
      "contactName": "John Doe",
      "contactPhone": "+1234567890",
      "address": "123 Main St, City, State"
    },
    "contactName": "Jane Smith",
    "contactPhone": "+0987654321",
    "poNumber": "PO-2024-001",
    "styleNo": "STYLE-001",
    "poDate": "2024-01-10T00:00:00.000Z",
    "deliveryDate": "2024-02-20T00:00:00.000Z",
    "quality": "Premium Cotton",
    "quantity": 500,
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

### 5. DELETE /api/orders/[id]
Delete a specific order by ID.

**Response (200):**
```json
{
  "message": "Order deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Order type is required and must be either 'Dying' or 'Printing', Party is required"
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
  "message": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

## Validation Rules

### Required Fields
- **orderType**: Must be "Dying" or "Printing"
- **arrivalDate**: Valid date format
- **party**: Valid MongoDB ObjectId

### Optional Fields with Validation
- **contactName**: Max 50 characters
- **contactPhone**: Max 20 characters
- **poNumber**: Max 50 characters
- **styleNo**: Max 50 characters
- **quality**: Max 100 characters
- **quantity**: Non-negative number
- **imageUrl**: Max 500 characters
- **poDate**: Valid date format
- **deliveryDate**: Valid date format

### Business Rules
- **Duplicate Prevention**: Cannot have same `poNumber` + `styleNo` combination for the same party
- **Party Validation**: Party must exist in the database
- **Auto-generated orderId**: Format `ORD-0001`, `ORD-0002`, etc.

## Features

### Advanced Filtering
- ✅ Party-based filtering
- ✅ Date range filtering (arrival date)
- ✅ Style number search (case-insensitive)
- ✅ PO number search (case-insensitive)
- ✅ Combined filtering support

### Pagination
- ✅ Server-side pagination
- ✅ Configurable page size (max 100)
- ✅ Pagination metadata in response
- ✅ Efficient skip/limit queries

### Performance Optimizations
- ✅ Database indexes for all search fields
- ✅ Compound indexes for common query patterns
- ✅ Unique compound index for duplicate prevention
- ✅ Efficient population of party data
- ✅ Optimized field selection

### Data Integrity
- ✅ Comprehensive input validation
- ✅ Duplicate prevention (PO + Style + Party)
- ✅ Foreign key validation (Party exists)
- ✅ Auto-generated unique orderId
- ✅ Proper error handling

### Security
- ✅ Authentication required for all endpoints
- ✅ Input sanitization and validation
- ✅ MongoDB injection prevention
- ✅ Proper error messages without data leakage

## Database Indexes

The Orders collection includes the following indexes for optimal performance:

### Single Field Indexes
- `orderId` (unique)
- `party`
- `poNumber`
- `styleNo`
- `orderType`
- `arrivalDate`
- `createdAt`
- `deliveryDate`

### Compound Indexes
- `{ party: 1, createdAt: -1 }`
- `{ orderType: 1, arrivalDate: -1 }`
- `{ party: 1, orderType: 1 }`
- `{ poNumber: 1, styleNo: 1 }`
- `{ arrivalDate: 1, deliveryDate: 1 }`
- `{ party: 1, poNumber: 1, styleNo: 1 }` (unique, sparse)

### Text Index
- Full-text search on `orderId`, `poNumber`, `styleNo`, `quality`

## Usage Examples

### Frontend Integration
```javascript
// Get orders with filters
const getOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/orders?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Create new order
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};

// Update order
const updateOrder = async (orderId, updates) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};
```
