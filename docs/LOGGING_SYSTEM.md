# CRM Admin Panel - Logging System

## Overview

The CRM Admin Panel now includes a comprehensive logging system that tracks all user activities, system events, and API operations. This system provides complete audit trails for security, debugging, and compliance purposes.

## Features

### 🔍 **Complete Activity Tracking**
- User login/logout events
- CRUD operations on all resources (orders, labs, parties, users, etc.)
- API request/response logging
- Error tracking and monitoring
- Performance metrics (request duration)

### 📊 **Advanced Filtering & Search**
- Filter by user, action, resource, date range
- Search by username, resource ID
- Filter by success/failure status
- Filter by severity level (info, warning, error, critical)

### 📈 **Analytics & Statistics**
- Activity statistics by time period
- Most active users
- Most common actions
- Error rate monitoring
- Performance metrics

### 🔐 **Security Features**
- IP address tracking
- User agent logging
- Session tracking
- Failed login attempt monitoring
- Access control (superadmin only)

## Database Schema

### Log Model Structure

```typescript
interface ILog {
  userId: string;           // User who performed the action
  username: string;         // Username for display
  userRole: string;         // User role (superadmin, user)
  action: string;           // Action performed (login, order_create, etc.)
  resource: string;         // Resource type (auth, order, lab, etc.)
  resourceId?: string;      // Specific resource ID
  details: {                // Additional context
    method?: string;        // HTTP method
    endpoint?: string;      // API endpoint
    ipAddress?: string;     // Client IP
    userAgent?: string;     // Browser/device info
    requestBody?: any;      // Request data
    responseStatus?: number; // HTTP status
    errorMessage?: string;  // Error details
    oldValues?: any;        // Previous values (for updates)
    newValues?: any;        // New values (for updates)
    metadata?: any;         // Additional data
  };
  timestamp: Date;          // When the action occurred
  sessionId?: string;       // Session identifier
  ipAddress?: string;       // Client IP address
  userAgent?: string;       // Browser/device info
  duration?: number;        // Request duration in ms
  success: boolean;         // Whether action succeeded
  severity: 'info' | 'warning' | 'error' | 'critical';
}
```

## API Endpoints

### Get Logs
```
GET /api/logs
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `userId` - Filter by user ID
- `username` - Filter by username (partial match)
- `action` - Filter by action type
- `resource` - Filter by resource type
- `resourceId` - Filter by specific resource ID
- `success` - Filter by success status (true/false)
- `severity` - Filter by severity level
- `startDate` - Start date for range filter
- `endDate` - End date for range filter
- `sortBy` - Sort field (default: timestamp)
- `sortOrder` - Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "pages": 25
    }
  }
}
```

### Get Log Statistics
```
GET /api/logs/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1250,
    "last24Hours": 45,
    "last7Days": 320,
    "last30Days": 1250,
    "byAction": [
      { "_id": "login", "count": 150 },
      { "_id": "order_create", "count": 89 }
    ],
    "byResource": [
      { "_id": "auth", "count": 150 },
      { "_id": "order", "count": 89 }
    ],
    "byUser": [
      { "_id": "admin", "count": 45 },
      { "_id": "user1", "count": 32 }
    ],
    "errors": 12,
    "recentErrors": 3
  }
}
```

### Cleanup Old Logs
```
DELETE /api/logs?daysToKeep=90
```

**Query Parameters:**
- `daysToKeep` - Number of days to keep (1-365, default: 90)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cleaned up logs older than 90 days",
    "deletedCount": 150
  }
}
```

## Usage Examples

### Basic Logging

```typescript
import { logAction, logCreate, logUpdate, logDelete, logView } from '@/lib/logger';

// Log a custom action
await logAction({
  action: 'custom_action',
  resource: 'custom_resource',
  details: { customData: 'value' }
}, request);

// Log CRUD operations
await logCreate('order', orderId, orderData, request);
await logUpdate('order', orderId, oldValues, newValues, request);
await logDelete('order', orderId, { reason: 'user_request' }, request);
await logView('order', orderId, request);
```

### API Route Integration

```typescript
import { logApiRequest } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const logger = await logApiRequest(request, 'order_create', 'order');
  
  try {
    // Your API logic here
    const result = await createOrder(data);
    
    // Log success
    await logger.logSuccess(201);
    
    return created(result);
  } catch (error) {
    // Log error
    await logger.logError(error.message, 500);
    return serverError(error);
  }
}
```

### Higher-Order Function

```typescript
import { withLogging } from '@/lib/logger';

const createOrderWithLogging = withLogging(
  createOrder,
  'order_create',
  'order',
  (data) => data.id // Function to extract resource ID
);

// Use the wrapped function
const result = await createOrderWithLogging(orderData);
```

## UI Components

### Logs Page
- **Location:** `/dashboard/logs`
- **Access:** Superadmin only
- **Features:**
  - Real-time log viewing
  - Advanced filtering
  - Export to CSV
  - Log cleanup
  - Pagination

### Recent Activity Widget
- **Location:** Dashboard (superadmin only)
- **Features:**
  - Shows last 10 activities
  - Quick access to full logs
  - Visual indicators for action types

## Logged Actions

### Authentication
- `login` - Successful login
- `logout` - User logout
- `login_failed` - Failed login attempt
- `password_change` - Password change
- `password_reset` - Password reset

### User Management
- `user_create` - Create user
- `user_update` - Update user
- `user_delete` - Delete user
- `user_activate` - Activate user
- `user_deactivate` - Deactivate user

### Order Management
- `order_create` - Create order
- `order_update` - Update order
- `order_delete` - Delete order
- `order_status_change` - Change order status

### Lab Management
- `lab_create` - Create lab
- `lab_update` - Update lab
- `lab_delete` - Delete lab
- `lab_status_change` - Change lab status

### Party Management
- `party_create` - Create party
- `party_update` - Update party
- `party_delete` - Delete party

### Quality Management
- `quality_create` - Create quality record
- `quality_update` - Update quality record
- `quality_delete` - Delete quality record

### File Operations
- `file_upload` - File upload
- `file_delete` - File deletion
- `file_download` - File download

### System Operations
- `system_backup` - System backup
- `system_restore` - System restore
- `system_config_change` - Configuration change

### Generic Actions
- `view` - View resource
- `export` - Export data
- `import` - Import data
- `search` - Search operation
- `filter` - Filter operation

## Logged Resources

- `auth` - Authentication
- `user` - User management
- `order` - Order management
- `lab` - Lab management
- `party` - Party management
- `quality` - Quality management
- `file` - File operations
- `system` - System operations
- `dashboard` - Dashboard views

## Performance Considerations

### Indexing
The Log model includes optimized indexes for common queries:
- `timestamp` - For date-based queries
- `userId + timestamp` - For user activity
- `action + timestamp` - For action-based queries
- `resource + timestamp` - For resource-based queries
- `success + timestamp` - For success/failure queries
- `severity + timestamp` - For severity-based queries

### Cleanup Strategy
- Automatic cleanup of logs older than 90 days (configurable)
- Manual cleanup via API endpoint
- Configurable retention periods

### Storage Optimization
- Lean queries for read operations
- Efficient aggregation for statistics
- Pagination to limit memory usage

## Security Considerations

### Access Control
- Only superadmin users can view logs
- API endpoints require authentication
- Session validation for all operations

### Data Privacy
- Sensitive data is not logged (passwords, tokens)
- IP addresses are logged for security
- User agent information for debugging

### Audit Trail
- Complete audit trail of all actions
- Immutable log records
- Timestamp and user attribution

## Monitoring & Alerts

### Error Monitoring
- Track failed operations
- Monitor error rates
- Alert on critical errors

### Performance Monitoring
- Request duration tracking
- Database query performance
- API response times

### Security Monitoring
- Failed login attempts
- Unusual activity patterns
- Access from suspicious IPs

## Best Practices

### When to Log
- All user actions
- All API operations
- All system events
- All errors and exceptions

### What to Log
- User identification
- Action performed
- Resource affected
- Success/failure status
- Relevant context
- Performance metrics

### What NOT to Log
- Passwords or tokens
- Sensitive personal data
- Large request bodies
- Temporary data

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check user permissions (superadmin only)
   - Verify database connection
   - Check for errors in console

2. **Performance issues**
   - Ensure indexes are created
   - Use pagination
   - Clean up old logs regularly

3. **Missing data**
   - Check if logging is enabled
   - Verify API route integration
   - Check for errors in logger

### Debug Commands

```bash
# Check log collection size
db.logs.stats()

# Find recent errors
db.logs.find({ success: false }).sort({ timestamp: -1 }).limit(10)

# Check user activity
db.logs.find({ userId: "user_id" }).sort({ timestamp: -1 })

# Get activity statistics
db.logs.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Future Enhancements

### Planned Features
- Real-time log streaming
- Advanced analytics dashboard
- Automated alerting system
- Log archiving to cloud storage
- Integration with external monitoring tools

### Performance Improvements
- Log compression
- Sharding for large datasets
- Caching for frequently accessed data
- Background processing for statistics

## Support

For issues or questions about the logging system:
1. Check this documentation
2. Review the code examples
3. Check the troubleshooting section
4. Contact the development team
