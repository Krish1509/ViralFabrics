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
  console.log('🔌 Attempting to connect to MongoDB...'); // Debug log
  if (cached.conn) {
    console.log('✅ Using cached connection'); // Debug log
    return cached.conn;
  }
  if (!cached.promise) {
    console.log('🔄 Creating new connection promise...'); // Debug log
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  console.log('✅ Connected to MongoDB successfully'); // Debug log
  return cached.conn;
}

