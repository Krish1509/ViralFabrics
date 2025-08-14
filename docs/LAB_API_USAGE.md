# Lab API Documentation

The Lab API manages lab records for order items. Each order item can have exactly one lab record.

## Overview

- **One Lab per Order Item**: Each order item can have only one lab record
- **Soft Delete**: Labs are soft deleted (marked as deleted but not removed from database)
- **Validation**: All inputs are validated using Zod schemas
- **Pagination**: List endpoints support pagination
- **Search**: Text search on lab send number and remarks

## API Endpoints

### 1. Create Lab
**POST** `/api/labs`

Create a new lab for a specific order item.

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "orderItemId": "507f1f77bcf86cd799439012",
  "labSendDate": "2024-01-15",
  "labSendNumber": "LAB-01-1",
  "labSendData": {
    "carrier": "BlueDart",
    "note": "Fragile items"
  },
  "status": "sent",
  "remarks": "Sent via express delivery"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "order": "507f1f77bcf86cd799439011",
    "orderItemId": "507f1f77bcf86cd799439012",
    "labSendDate": "2024-01-15T00:00:00.000Z",
    "labSendNumber": "LAB-01-1",
    "status": "sent",
    "remarks": "Sent via express delivery",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. List Labs
**GET** `/api/labs`

Get paginated list of labs with optional filtering.

**Query Parameters:**
- `orderId` (optional): Filter by order ID
- `status` (optional): Filter by status (`sent`, `received`, `cancelled`)
- `q` (optional): Search in lab send number and remarks
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `includeDeleted` (optional): Include soft deleted labs (default: false)

**Example:**
```
GET /api/labs?orderId=507f1f77bcf86cd799439011&status=sent&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "order": "507f1f77bcf86cd799439011",
        "orderItemId": "507f1f77bcf86cd799439012",
        "labSendDate": "2024-01-15T00:00:00.000Z",
        "labSendNumber": "LAB-01-1",
        "status": "sent",
        "orderDetails": {
          "_id": "507f1f77bcf86cd799439011",
          "orderId": "ORD-01",
          "orderType": "Dying"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 3. Get Single Lab
**GET** `/api/labs/[id]`

Get a specific lab by ID.

**Example:**
```
GET /api/labs/507f1f77bcf86cd799439013
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-01",
      "orderType": "Dying"
    },
    "orderItemId": "507f1f77bcf86cd799439012",
    "labSendDate": "2024-01-15T00:00:00.000Z",
    "labSendNumber": "LAB-01-1",
    "status": "sent",
    "remarks": "Sent via express delivery"
  }
}
```

### 4. Update Lab
**PUT** `/api/labs/[id]`

Update a lab (order and orderItemId are immutable).

**Request Body:**
```json
{
  "status": "received",
  "receivedDate": "2024-01-17",
  "remarks": "Received in good condition"
}
```

**Example:**
```
PUT /api/labs/507f1f77bcf86cd799439013
```

### 5. Delete Lab
**DELETE** `/api/labs/[id]`

Soft delete a lab (marks as deleted but doesn't remove from database).

**Example:**
```
DELETE /api/labs/507f1f77bcf86cd799439013
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Lab deleted successfully"
  }
}
```

### 6. Get Labs by Order
**GET** `/api/labs/by-order/[orderId]`

Get all labs for a specific order with order item details.

**Example:**
```
GET /api/labs/by-order/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-01",
      "orderType": "Dying"
    },
    "labs": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "orderItemId": "507f1f77bcf86cd799439012",
        "labSendNumber": "LAB-01-1",
        "status": "sent",
        "orderItem": {
          "_id": "507f1f77bcf86cd799439012",
          "quality": "507f1f77bcf86cd799439014",
          "quantity": 100
        }
      }
    ],
    "total": 1
  }
}
```

### 7. Seed Labs from Order
**POST** `/api/labs/seed-from-order/[orderId]`

Automatically create labs for all items in an order.

**Request Body:**
```json
{
  "labSendDate": "2024-01-15",
  "prefix": "LAB-",
  "startIndex": 1,
  "overrideExisting": false
}
```

**Example:**
```
POST /api/labs/seed-from-order/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully processed 2 order items",
    "createdCount": 2,
    "skippedCount": 0,
    "labs": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "labSendNumber": "LAB-ORD-01-1",
        "status": "sent"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "labSendNumber": "LAB-ORD-01-2",
        "status": "sent"
      }
    ],
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-01",
      "itemsCount": 2
    }
  }
}
```

## Data Models

### Lab Schema
```typescript
interface ILab {
  _id: ObjectId;
  order: ObjectId;           // Reference to Order
  orderItemId: ObjectId;     // Reference to Order Item
  labSendDate: Date;         // Required
  labSendData?: string | Record<string, any>; // Optional
  labSendNumber: string;     // Required, unique
  status: 'sent' | 'received' | 'cancelled'; // Default: 'sent'
  receivedDate?: Date;       // Optional
  attachments?: Array<{      // Optional
    url: string;
    fileName: string;
  }>;
  remarks?: string;          // Optional
  softDeleted: boolean;      // Default: false
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `404` - Not Found (order/lab not found)
- `409` - Conflict (lab already exists for order item)
- `500` - Internal Server Error

## Validation Rules

1. **ObjectId Validation**: All ObjectId fields must be valid MongoDB ObjectIds
2. **Unique Constraint**: Only one lab per order item (order + orderItemId combination)
3. **Required Fields**: orderId, orderItemId, labSendDate, labSendNumber
4. **Date Format**: Dates must be ISO 8601 strings
5. **Status Values**: Must be one of: 'sent', 'received', 'cancelled'
6. **Immutable Fields**: order and orderItemId cannot be changed after creation

## Best Practices

1. **Use Seed Endpoint**: For orders with multiple items, use the seed endpoint to create labs efficiently
2. **Check Existing**: Always check if a lab exists before creating a new one
3. **Soft Delete**: Use soft delete instead of hard delete to maintain data integrity
4. **Pagination**: Use pagination for large datasets
5. **Search**: Use the search parameter for finding labs by number or remarks
