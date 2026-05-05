import mongoose from "mongoose";

let cached = (global as any).mongooseConn;
if (!cached) {
  cached = (global as any).mongooseConn = { conn: null, promise: null };
}

const connectDb = async () => {
  const mongodbUrl = process.env.MONGODB_URL;

  if (!mongodbUrl) {
    console.error("❌ MONGODB_URL is missing in environment variables.");
    throw new Error("db error");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUrl).then((conn) => conn.connection);
  }

  try {
    const conn = await cached.promise;
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
};

export default connectDb