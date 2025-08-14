# Lab Module Implementation Summary

## Overview
Successfully implemented a complete Lab module for the CRM system that manages lab records for order items. Each order item can have exactly one lab record, ensuring data integrity and proper tracking.

## What Was Implemented

### 1. Database Model (`models/Lab.ts`)
- **Lab Schema** with all required fields:
  - `order`: Reference to Order (ObjectId)
  - `orderItemId`: Reference to Order Item (ObjectId)
  - `labSendDate`: Date when lab was sent (required)
  - `labSendData`: Mixed data field for additional info
  - `labSendNumber`: Unique lab number (required)
  - `status`: Enum ('sent', 'received', 'cancelled')
  - `receivedDate`: Optional date when received
  - `attachments`: Array of file attachments
  - `remarks`: Optional text field
  - `softDeleted`: Boolean for soft delete functionality

- **Critical Indexes**:
  - Unique compound index: `{ order: 1, orderItemId: 1 }` - ensures one lab per order item
  - Performance indexes for common queries
  - Text index for search functionality

- **Validation**:
  - Pre-save middleware to verify order item exists
  - Error handling for duplicate labs
  - TypeScript interfaces for type safety

### 2. Validation Schemas (`lib/validation/lab.ts`)
- **Zod schemas** for all API endpoints:
  - `createLabSchema`: For creating new labs
  - `updateLabSchema`: For updating existing labs
  - `queryLabsSchema`: For GET requests with filtering
  - `seedFromOrderSchema`: For bulk lab creation

- **Features**:
  - ObjectId validation
  - Date coercion from ISO strings
  - Required field validation
  - Enum validation for status

### 3. Utility Functions
- **`lib/http.ts`**: HTTP response helpers for consistent API responses
- **`lib/ids.ts`**: ObjectId validation and order item verification utilities

### 4. API Routes

#### Main Routes:
- **`app/api/labs/route.ts`**:
  - `POST`: Create new lab with validation
  - `GET`: List labs with pagination, filtering, and search

- **`app/api/labs/[id]/route.ts`**:
  - `GET`: Get single lab by ID
  - `PUT`: Update lab (immutable fields protected)
  - `DELETE`: Soft delete lab

#### Specialized Routes:
- **`app/api/labs/by-order/[orderId]/route.ts`**:
  - `GET`: Get all labs for a specific order with item details

- **`app/api/labs/seed-from-order/[orderId]/route.ts`**:
  - `POST`: Automatically create labs for all items in an order

### 5. Documentation
- **`docs/LAB_API_USAGE.md`**: Comprehensive API documentation
- **`docs/lab.http`**: Test requests for API testing

## Key Features

### ✅ One Lab Per Order Item
- Unique constraint ensures exactly one lab per order item
- Prevents duplicate lab records
- Maintains data integrity

### ✅ Soft Delete
- Labs are marked as deleted but not removed from database
- Maintains historical data
- Can be restored if needed

### ✅ Comprehensive Validation
- All inputs validated with Zod schemas
- ObjectId validation
- Date format validation
- Required field validation

### ✅ Search & Filtering
- Text search on lab send number and remarks
- Filter by order, status, date ranges
- Pagination support

### ✅ Bulk Operations
- Seed endpoint to create labs for all items in an order
- Efficient batch processing
- Skip existing labs option

### ✅ Error Handling
- Consistent error responses
- Proper HTTP status codes
- Detailed error messages

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/labs` | Create new lab |
| GET | `/api/labs` | List labs with filtering |
| GET | `/api/labs/[id]` | Get single lab |
| PUT | `/api/labs/[id]` | Update lab |
| DELETE | `/api/labs/[id]` | Soft delete lab |
| GET | `/api/labs/by-order/[orderId]` | Get labs for order |
| POST | `/api/labs/seed-from-order/[orderId]` | Create labs for all order items |

## Database Schema

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

## Usage Examples

### Create a Lab
```bash
POST /api/labs
{
  "orderId": "507f1f77bcf86cd799439011",
  "orderItemId": "507f1f77bcf86cd799439012",
  "labSendDate": "2024-01-15",
  "labSendNumber": "LAB-01-1",
  "status": "sent"
}
```

### Seed Labs from Order
```bash
POST /api/labs/seed-from-order/507f1f77bcf86cd799439011
{
  "labSendDate": "2024-01-15",
  "prefix": "LAB-",
  "startIndex": 1
}
```

### List Labs with Filtering
```bash
GET /api/labs?orderId=507f1f77bcf86cd799439011&status=sent&page=1&limit=10
```

## Dependencies Added
- `zod`: For request validation

## Files Created/Modified

### New Files:
- `models/Lab.ts`
- `lib/http.ts`
- `lib/ids.ts`
- `lib/validation/lab.ts`
- `app/api/labs/route.ts`
- `app/api/labs/[id]/route.ts`
- `app/api/labs/by-order/[orderId]/route.ts`
- `app/api/labs/seed-from-order/[orderId]/route.ts`
- `docs/LAB_API_USAGE.md`
- `docs/lab.http`

### Modified Files:
- `models/index.ts` - Added Lab model export
- `package.json` - Added zod dependency

## Testing
The implementation includes comprehensive test requests in `docs/lab.http` that can be used with REST client extensions to test all API endpoints.

## Next Steps
1. Test all API endpoints using the provided test requests
2. Integrate with frontend components
3. Add any additional business logic specific to your needs
4. Consider adding audit logging for lab status changes
