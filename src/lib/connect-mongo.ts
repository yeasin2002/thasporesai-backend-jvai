import chalk from "chalk";
import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.DATABASE_URL!);
		console.log(
			chalk.bgGreen.white(`MongoDB Connected: ${conn.connection.host}`),
		);
	} catch (error: unknown) {
		console.error(chalk.bgRed.white(`Error: ${(error as Error).message}`));
		process.exit(1);
	}
};
