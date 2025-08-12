# Order Schema Design Documentation

## Overview

This document outlines the design decisions, best practices, and implementation details for the Order management system using Mongoose and MongoDB.

## Schema Design Decisions

### 1. Embedded vs Referenced Items

**Decision: Embedded Items (Subdocuments)**

**Why Embedded:**
- **Atomicity**: Order and items are always consistent
- **Performance**: Single query retrieves complete order
- **Simplicity**: No complex joins or population needed
- **Data Locality**: Items are always with their parent order

**When to Consider Referenced:**
- If items are shared across multiple orders
- If items have complex relationships with other entities
- If items need independent lifecycle management
- If items exceed 16MB document size limit

**Current Implementation:**
```typescript
items: {
  type: [OrderItemSchema],
  required: [true, "At least one item is required"],
  validate: {
    validator: function(items: IOrderItem[]) {
      return items && items.length > 0;
    },
    message: "Order must contain at least one item"
  }
}
```

### 2. Field Types and Validation

#### Order Number
- **Type**: String with auto-generation
- **Format**: `ORD{timestamp}{random}` (e.g., ORD1A2B3C4D5E6F)
- **Validation**: Uppercase, alphanumeric with hyphens/underscores
- **Index**: Unique compound index

#### Dates
- **Order Date**: Defaults to current date
- **PO Date**: Must be ≤ Order Date
- **Delivery Date**: Must be > Order Date
- **All dates**: Indexed for range queries

#### Party Code
- **Type**: String (2-10 characters)
- **Format**: Uppercase short codes
- **Index**: For party-based filtering

#### Contact Information
- **Name**: 2-100 characters, trimmed
- **Contact Number**: Validated phone format
- **Index**: Name for text search

### 3. Performance Optimizations

#### Index Strategy

**Single Field Indexes:**
```typescript
OrderSchema.index({ orderNo: 1 }, { unique: true });
OrderSchema.index({ party: 1 });
OrderSchema.index({ poNo: 1 });
OrderSchema.index({ styleNo: 1 });
OrderSchema.index({ status: 1 });
```

**Compound Indexes for Common Queries:**
```typescript
OrderSchema.index({ party: 1, date: -1 }); // Orders by party and date
OrderSchema.index({ party: 1, status: 1 }); // Orders by party and status
OrderSchema.index({ date: -1, status: 1 }); // Recent orders by status
OrderSchema.index({ deliveryDate: 1, status: 1 }); // Delivery schedule
```

**Text Index for Search:**
```typescript
OrderSchema.index({ 
  orderNo: "text", 
  party: "text", 
  name: "text", 
  poNo: "text", 
  styleNo: "text" 
}, {
  weights: {
    orderNo: 5,
    party: 4,
    poNo: 3,
    styleNo: 2,
    name: 1
  }
});
```

#### Query Optimization Techniques

1. **Lean Queries**: Use `.lean()` for read-only operations
2. **Field Selection**: Select only needed fields with `.select()`
3. **Pagination**: Implement proper skip/limit for large datasets
4. **Aggregation**: Use MongoDB aggregation for complex analytics

### 4. Image Storage Recommendations

#### Option 1: URL Storage (Recommended for Most Cases)

**Pros:**
- Simple implementation
- No database storage overhead
- CDN integration possible
- Easy backup and migration

**Cons:**
- External dependency
- Potential broken links
- No atomic transactions

**Implementation:**
```typescript
image: {
  type: String,
  trim: true,
  validate: {
    validator: validateImageUrl,
    message: "Please provide a valid image URL or file path"
  }
}
```

#### Option 2: GridFS (For Large Files)

**When to Use:**
- Files > 16MB
- Need atomic operations
- Complex file metadata
- Backup requirements

**Implementation:**
```typescript
// Add to package.json
"multer": "^1.4.5-lts.1",
"gridfs-stream": "^1.1.1"

// GridFS setup
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: 'order-images',
      filename: `${Date.now()}-${file.originalname}`
    };
  }
});
```

#### Option 3: Base64 (Not Recommended)

**Avoid for:**
- Large files
- High-traffic applications
- Performance-critical systems

### 5. Scalability Considerations

#### Document Size Limits

**MongoDB Limits:**
- Document: 16MB
- Embedded array: 16MB
- Index key: 1024 bytes

**Monitoring:**
```typescript
// Add to schema for monitoring
OrderSchema.pre('save', function(next) {
  const docSize = JSON.stringify(this.toObject()).length;
  if (docSize > 15000000) { // 15MB warning
    console.warn(`Large order document: ${docSize} bytes`);
  }
  next();
});
```

#### Sharding Strategy

**Shard Key Options:**
1. **Party-based**: `{ party: 1, date: -1 }`
2. **Date-based**: `{ date: 1 }`
3. **Order Number**: `{ orderNo: 1 }`

**Recommendation:**
```typescript
// For party-based sharding
OrderSchema.index({ party: 1, date: -1 }, { 
  background: true,
  name: "shard_key_index"
});
```

#### Read/Write Optimization

**Read Optimization:**
- Use read replicas for analytics
- Implement caching (Redis)
- Use aggregation pipelines

**Write Optimization:**
- Bulk operations for data migration
- Unordered writes for better performance
- Proper indexing strategy

### 6. Data Validation and Business Rules

#### Pre-save Hooks

```typescript
OrderSchema.pre('save', function(next) {
  // Auto-generate order number
  if (!this.orderNo) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNo = `ORD${timestamp}${random}`;
  }
  
  // Calculate total quantity
  this.totalQuantity = this.calculateTotalQuantity();
  
  // Validate dates
  if (this.deliveryDate && this.date && this.deliveryDate <= this.date) {
    return next(new Error('Delivery date must be after order date'));
  }
  
  next();
});
```

#### Custom Validation

```typescript
const validateContactNumber = (phone: string) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

const validateImageUrl = (url: string) => {
  if (!url) return true;
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  const filePathRegex = /^[\/\\]?[\w\-\/\\]+\.(jpg|jpeg|png|gif|webp)$/i;
  return urlRegex.test(url) || filePathRegex.test(url);
};
```

### 7. Error Handling and Monitoring

#### Error Handling Middleware

```typescript
OrderSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`${field} already exists`));
  } else {
    next(error);
  }
});
```

#### Monitoring Queries

```typescript
// Add to your application
mongoose.set('debug', process.env.NODE_ENV === 'development');

// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 });
```

### 8. Migration and Data Import

#### CSV/Excel Import Strategy

```typescript
import csv from 'csv-parser';
import fs from 'fs';

export const importOrdersFromCSV = async (filePath: string) => {
  const orders: Partial<IOrder>[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        orders.push({
          orderNo: row.OrderNo,
          date: new Date(row.Date),
          party: row.Party.toUpperCase(),
          name: row.Name,
          contactNumber: row.ContactNumber,
          poNo: row.PONo.toUpperCase(),
          styleNo: row.StyleNo.toUpperCase(),
          poDate: new Date(row.PODate),
          deliveryDate: new Date(row.DeliveryDate),
          items: JSON.parse(row.Items || '[]')
        });
      })
      .on('end', async () => {
        try {
          const result = await Order.insertMany(orders, { 
            ordered: false,
            rawResult: false 
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
  });
};
```

### 9. Security Considerations

#### Input Sanitization

```typescript
// Sanitize inputs
OrderSchema.pre('save', function(next) {
  // Trim strings
  this.party = this.party?.trim().toUpperCase();
  this.name = this.name?.trim();
  this.poNo = this.poNo?.trim().toUpperCase();
  this.styleNo = this.styleNo?.trim().toUpperCase();
  
  next();
});
```

#### Access Control

```typescript
// Add user context to orders
OrderSchema.add({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
});
```

### 10. Testing Strategy

#### Unit Tests

```typescript
describe('Order Schema', () => {
  it('should auto-generate order number', async () => {
    const order = new Order({
      party: 'TEST',
      name: 'Test User',
      // ... other required fields
    });
    
    await order.save();
    expect(order.orderNo).toMatch(/^ORD[A-Z0-9]+$/);
  });
  
  it('should validate delivery date', async () => {
    const order = new Order({
      date: new Date('2024-01-15'),
      deliveryDate: new Date('2024-01-10'), // Before order date
      // ... other fields
    });
    
    await expect(order.save()).rejects.toThrow('Delivery date must be after order date');
  });
});
```

#### Performance Tests

```typescript
describe('Order Performance', () => {
  it('should handle bulk insert efficiently', async () => {
    const orders = Array.from({ length: 1000 }, (_, i) => ({
      party: `PARTY${i}`,
      name: `User ${i}`,
      // ... other fields
    }));
    
    const start = Date.now();
    await Order.insertMany(orders);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

## Conclusion

This Order schema design provides:

1. **Scalability**: Optimized for millions of records
2. **Performance**: Strategic indexing and query optimization
3. **Flexibility**: Embedded items with proper validation
4. **Maintainability**: Clear structure and documentation
5. **Security**: Input validation and sanitization
6. **Monitoring**: Built-in error handling and performance tracking

The design balances performance, flexibility, and maintainability while providing a solid foundation for a production-ready order management system.
