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

export default async function dbConnectProduction(): Promise<Mongoose> {
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
      bufferCommands: true,
      maxPoolSize: 1, // Minimal pool for serverless
      serverSelectionTimeoutMS: 8000, // More reasonable timeout
      socketTimeoutMS: 20000, // More reasonable socket timeout
      family: 4, // Use IPv4 only
      retryWrites: true,
      retryReads: false, // Disable retry reads for speed
      connectTimeoutMS: 8000, // More reasonable connection timeout
      maxIdleTimeMS: 10000, // Short idle time
      heartbeatFrequencyMS: 2000, // Frequent heartbeats
      maxConnecting: 1, // Single connection
      directConnection: false,
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
