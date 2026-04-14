import mongoose from "mongoose";

function getMongoUri(): string {
  // Docs use MONGO_URI, but some envs may use MONGODB_URI.
  const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing Mongo connection string (MONGO_URI).");
  }
  return uri;
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(getMongoUri());
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
};

