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
      console.log('Cached connection is invalid, creating new connection...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  // If we don't have a connection promise, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Enable buffering to prevent connection errors
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      socketTimeoutMS: 60000, // Increased to 60 seconds
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000, // Connection timeout
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

