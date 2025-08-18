# Orders API Troubleshooting Guide

## Issue: Intermittent 500 Errors on Orders API

### Problem Description
The `/api/orders` endpoint sometimes returns 500 (Internal Server Error) but works after refreshing 1-2 times.

### Root Causes Identified
1. **Database Connection Issues**: MongoDB connection timeouts or failures
2. **Race Conditions**: Multiple concurrent requests causing counter/order ID conflicts
3. **Memory Issues**: Application running out of memory
4. **Network Timeouts**: Slow database responses

### Solutions Implemented

#### 1. Improved Database Connection Management
- Added retry logic with exponential backoff
- Implemented connection pooling (max 10 connections)
- Added connection validation before use
- Set appropriate timeouts for database operations

#### 2. Enhanced Error Handling
- Added specific error messages for different failure types
- Implemented proper HTTP status codes (503 for database issues, 408 for timeouts)
- Added detailed logging for debugging

#### 3. Query Optimization
- Added `maxTimeMS` to prevent long-running queries
- Implemented Promise.race with timeouts
- Added proper indexing for better performance

#### 4. Race Condition Prevention
- Improved counter sequence generation with retry logic
- Added duplicate key error handling with automatic retry
- Enhanced order creation with better error recovery

### Testing and Monitoring

#### 1. Test Database Connection
```bash
npx tsx scripts/test-db-connection.ts
```

#### 2. Monitor API Performance
```bash
npx tsx scripts/monitor-orders-api.ts
```

#### 3. Check Application Health
Visit: `http://localhost:3000/api/health`

### Environment Configuration

Make sure your `.env.local` file contains:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority
```

### Performance Optimization Tips

1. **Database Indexes**: Ensure all required indexes are created
2. **Connection Pooling**: Monitor connection pool usage
3. **Query Optimization**: Use proper select fields and limit results
4. **Caching**: Consider implementing Redis for frequently accessed data

### Common Error Messages and Solutions

#### "Database connection failed after multiple attempts"
- Check MongoDB server status
- Verify connection string
- Check network connectivity

#### "Request timeout"
- Increase timeout values in database configuration
- Check database server load
- Optimize slow queries

#### "Order ID already exists"
- This is handled automatically with retry logic
- Check for concurrent order creation

### Monitoring Commands

#### Check API Status
```bash
curl http://localhost:3000/api/health
```

#### Test Orders API
```bash
curl http://localhost:3000/api/orders
```

#### Monitor in Real-time
```bash
npx tsx scripts/monitor-orders-api.ts
```

### Log Analysis

Check the console output for:
- Database connection attempts
- Query execution times
- Error messages with stack traces
- Retry attempts and success rates

### Performance Metrics to Monitor

1. **Response Times**: Should be under 2 seconds
2. **Error Rates**: Should be under 1%
3. **Database Connection Pool**: Should not be exhausted
4. **Memory Usage**: Should be stable

### Emergency Fixes

If the API is completely down:

1. **Restart the Application**
   ```bash
   npm run dev
   ```

2. **Check Database Status**
   ```bash
   npx tsx scripts/test-db-connection.ts
   ```

3. **Clear Application Cache**
   - Delete `.next` folder
   - Restart the application

4. **Check Environment Variables**
   - Verify `.env.local` exists and is correct
   - Ensure MongoDB URI is valid

### Prevention Measures

1. **Regular Monitoring**: Use the monitoring script to track API health
2. **Database Maintenance**: Regular database optimization and index updates
3. **Load Testing**: Test with multiple concurrent users
4. **Backup Strategy**: Regular database backups
5. **Alert System**: Set up alerts for high error rates

### Support

If issues persist:
1. Check the application logs
2. Run the diagnostic scripts
3. Monitor the API performance
4. Contact the development team with error logs
