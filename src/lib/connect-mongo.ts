import chalk from "chalk";
import mongoose from "mongoose";
import applyDefaultsPlugin from "./apply-defaults.mongoose-plugins";
import { DATABASE_URL } from "./Env";

export const connectDB = async () => {
	try {
		// register the plugin globally BEFORE models are compiled
		mongoose.plugin(applyDefaultsPlugin);

		const conn = await mongoose.connect(DATABASE_URL, {
			// your recommended options
			// useNewUrlParser and useUnifiedTopology are defaults in modern mongoose,
			// but you can include options you need here.
		});

		console.log(
			chalk.bgGreen.white(`MongoDB Connected: ${conn.connection.host}`),
		);
	} catch (error: unknown) {
		console.error(chalk.bgRed.white(`Error: ${(error as Error).message}`));
		process.exit(1);
	}
};
