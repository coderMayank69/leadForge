import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local\n' +
    'Get your free MongoDB Atlas URI from: https://cloud.mongodb.com'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Connection options tuned for Vercel serverless + MongoDB Atlas free tier.
// Each serverless function shares a connection pool. We keep the pool small
// (10) so we don't exhaust Atlas M0's 500-connection ceiling across many
// concurrent function instances, but large enough to handle burst traffic
// within a single instance without queuing.
const MONGO_OPTS: mongoose.ConnectOptions = {
  // Don't let Mongoose buffer operation calls when the connection drops.
  // We'd rather surface a fast error than silently queue and freeze.
  bufferCommands: false,

  // Connections available per serverless instance. 10 is a safe sweet spot:
  // high enough for parallel queries, low enough that 50 cold instances
  // won't blow through Atlas M0's 500-connection limit.
  maxPoolSize: 10,

  // Minimum connections kept alive so we don't wait for a handshake on
  // every warm request.
  minPoolSize: 2,

  // Atlas free tier can take 10–15 s to accept a connection after a
  // cluster "wakes" from idle. 15 s gives it breathing room.
  serverSelectionTimeoutMS: 15000,

  // How long a socket can sit idle before being closed by the driver.
  socketTimeoutMS: 45000,

  // How long the driver waits to establish a new TCP connection.
  connectTimeoutMS: 15000,

  // Heartbeat every 10 s; Atlas will close sockets idle > 30 s, so this
  // keeps them alive and detects failures quickly.
  heartbeatFrequencyMS: 10000,
};

async function dbConnect(): Promise<typeof mongoose> {
  // Reuse an established connection — this is the hot path for warm lambdas.
  if (cached.conn) {
    return cached.conn;
  }

  // Only one connection attempt in flight at a time; subsequent calls share
  // the same promise so we don't spin up duplicate connections during a
  // cold-start burst.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, MONGO_OPTS)
      .then((mg) => {
        console.log('✅ MongoDB connected');
        return mg;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request gets a fresh connection attempt rather than
    // replaying a failed promise forever.
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', err);
    throw err;
  }

  return cached.conn;
}

export default dbConnect;

