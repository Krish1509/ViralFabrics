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
      serverSelectionTimeoutMS: 2000, // More reasonable timeout
      socketTimeoutMS: 5000, // More reasonable socket timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true, // Enable retries for reliability
      retryReads: true, // Enable retries for reliability
      connectTimeoutMS: 2000, // More reasonable connection timeout
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
    throw error;
  }
}

