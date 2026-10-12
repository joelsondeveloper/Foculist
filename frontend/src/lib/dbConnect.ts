import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
    );
}

interface MongooseCache {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

declare global {
    var mongooseCache: MongooseCache | undefined;
}

const globalCache = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = globalCache;

const cached = global.mongooseCache;

async function dbConnect(): Promise<Mongoose> {
    if (cached.conn?.connection.readyState === 1) {
        return cached.conn;
    }

    if (cached.conn) {
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI as string, {
            bufferCommands: false,
        });
    }
    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        // A temporary Atlas/network failure must not poison this process forever.
        cached.promise = null;
        throw error;
    }
    }

export default dbConnect
