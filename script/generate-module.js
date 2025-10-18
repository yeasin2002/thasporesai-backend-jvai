#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";

const readline = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const question = (query) =>
	new Promise((resolve) => readline.question(query, resolve));

// Helper to capitalize first letter
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Helper to convert to PascalCase
const toPascalCase = (str) =>
	str
		.split(/[-_\s]/)
		.map(capitalize)
		.join("");

// Helper to convert to camelCase for variable names
const toCamelCase = (str) => {
	const pascal = toPascalCase(str);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Generate controller template
const generateRoute = (moduleName) => {
	const camelName = toCamelCase(moduleName);
	return `
  import "./${moduleName}.openapi";

  import express, { Router } from "express";

export const ${camelName}: Router = express.Router();

// TODO: Add your routes here
// Example:
// ${camelName}.get("/", handler);
// ${camelName}.post("/", validateBody(schema), handler);
`;
};

// Generate service template
const generateService = (_moduleName) => {
	return `
import type { RequestHandler } from "express";

// TODO: Add your request handlers here
// Example:
 export const handler: RequestHandler = async (req, res) => {
   try {
     res.status(200).json({
       status: 200,
       message: "Success",
       data: null,
     });
   } catch (error) {
     console.log(error);
     res.status(500).json({
       status: 500,
       message: "Internal Server Error",
       data: null,
     });
   }
 };
`;
};

// Generate schema template
const generateValidation = (_moduleName) => {
	return `import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// TODO: Define your validation schemas here
// Example:
// export const ExampleValidation = z.object({
//   name: z.string().min(1).openapi({ description: "Name" }),
// }).openapi("Example");
//
// export type Example = z.infer<typeof ExampleValidation>;
`;
};

const generateOpenAPI = (moduleName) => {
	return `
import { registry } from "@/lib/openapi";

// registry.register("${moduleName}", ${moduleName}Schema);
registry.registerPath({
  method: "post",
  path: "/api/${moduleName}",
  description: "",
  summary: "",
  tags: ["${moduleName}"],
  responses: {
    200: {
      description: "${moduleName} retrieved successfully",
      // content: {"application/json": {schema: ${moduleName}ResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/${moduleName}",
//   description: "",
//   summary: "",
//   tags: ["${moduleName}"],
//   responses: {
//     200: {
//       description: "${moduleName} retrieved successfully",
//       content: {
//         "application/json": {
//           schema: ${moduleName}ResponseSchema,
//         },
//       },
//     },
//     500: {
//       description: "Internal server error",
//       content: {
//         "application/json": {
//           schema: ErrorResponseSchema,
//         },
//       },
//     },
//   },
// });


`;
};

async function main() {
	try {
		console.log("🚀 Module Generator for JobSphere API\n");

		const moduleName = await question(
			"Enter module name (e.g., user, job, booking): ",
		);

		if (!moduleName || moduleName.trim() === "") {
			console.error("❌ Module name cannot be empty!");
			process.exit(1);
		}

		const cleanModuleName = moduleName.trim().toLowerCase();
		const pascalName = toPascalCase(cleanModuleName);

		console.log(`\n📦 Creating module: ${cleanModuleName}`);
		console.log(`📝 PascalCase name: ${pascalName}\n`);

		// Create module directory
		const modulePath = join(process.cwd(), "src", "api", cleanModuleName);
		await mkdir(modulePath, { recursive: true });
		console.log(`✅ Created directory: src/api/${cleanModuleName}`);

		// Generate files
		const files = [
			{
				name: `${cleanModuleName}.route.ts`,
				content: generateRoute(cleanModuleName),
			},
			{
				name: `${cleanModuleName}.service.ts`,
				content: generateService(cleanModuleName),
			},
			{
				name: `${cleanModuleName}.validation.ts`,
				content: generateValidation(cleanModuleName),
			},
			{
				name: `${cleanModuleName}.openapi.ts`,
				content: generateOpenAPI(cleanModuleName),
			},
		];

		for (const file of files) {
			const filePath = join(modulePath, file.name);
			await writeFile(filePath, file.content, "utf-8");
			console.log(`✅ Created file: src/api/${cleanModuleName}/${file.name}`);
		}

		console.log(`\n🎉 Module "${cleanModuleName}" created successfully!`);
		console.log(`\n📋 Next steps:`);
		console.log(`   1. Define schemas in ${cleanModuleName}.validation.ts`);
		console.log(`   2. Add handlers in ${cleanModuleName}.service.ts`);
		console.log(`   3. Define routes in ${cleanModuleName}.route.ts`);
		console.log(
			`   4. Register route in src/app.ts: app.use("/api/${cleanModuleName}", ${toCamelCase(
				cleanModuleName,
			)})\n`,
		);
	} catch (error) {
		console.error("❌ Error creating module:", error.message);
		process.exit(1);
	} finally {
		readline.close();
	}
}

main();
