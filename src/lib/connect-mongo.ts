import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};
