import mongoose, { type Mongoose } from "mongoose";

const MONGODB_URI_ENV = process.env.MONGODB_URI;

if (!MONGODB_URI_ENV) {
  throw new Error("Please add MONGODB_URI to .env");
}

const MONGODB_URI = MONGODB_URI_ENV as string;

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const globalWithCache = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache =
  globalWithCache.mongooseCache ??
  (globalWithCache.mongooseCache = { conn: null, promise: null });

export default async function dbConnect(): Promise<Mongoose> {
  // If we have a cached connection, check if it's still valid
  if (cached.conn) {
    try {
      // Test the connection
      if (cached.conn.connection.db) {
        await cached.conn.connection.db.admin().ping();
        return cached.conn;
      }
    } catch (error) {
      // Cached connection is invalid, creating new connection...
      cached.conn = null;
      cached.promise = null;
    }
  }

  // If we don't have a connection promise, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering for faster responses
      maxPoolSize: 5, // Increased pool for better reliability
      serverSelectionTimeoutMS: 3000, // Reduced timeout for faster failure detection
      socketTimeoutMS: 5000, // Reduced socket timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true, // Enable retries for reliability
      retryReads: true, // Enable retries for reliability
      connectTimeoutMS: 3000, // Reduced connection timeout
      maxIdleTimeMS: 10000, // Longer idle time for stability
      heartbeatFrequencyMS: 2000, // More reasonable heartbeat
      maxConnecting: 2, // Allow 2 connections for reliability
      directConnection: false, // Use connection pooling
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[], // Enable compression
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Reset the promise if connection fails
    cached.promise = null;
    
    // Log the specific error for debugging
    console.error('Database connection failed:', error);
    
    // For development, we can provide more helpful error messages
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔧 Development Mode - Database Connection Help:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('4. Try using a local MongoDB instance');
      console.log('5. Check your .env file for correct MONGODB_URI\n');
    }
    
    throw error;
  }
}

// Export a function to check if we're in offline mode
export function isOfflineMode(): boolean {
  return process.env.OFFLINE_MODE === 'true';
}

// Export a function to get mock data for offline development
export function getMockData() {
  return {
    users: [
      {
        _id: 'mock-user-1',
        username: 'admin',
        name: 'Admin User',
        role: 'admin',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    orders: [],
    fabrics: [],
    parties: []
  };
}