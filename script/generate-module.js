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
const generateController = (moduleName) => {
  const pascalName = toPascalCase(moduleName);
  const camelName = toCamelCase(moduleName);
  return `import { validateBody, validateParams } from "@/middleware/validation";
import express, { Router } from "express";
import {
  Create${pascalName}Schema,
  Update${pascalName}Schema,
  ${pascalName}IdSchema,
} from "./${moduleName}.schema";
import { create${pascalName}, delete${pascalName}, getAll${pascalName}, update${pascalName} } from "./${moduleName}.service";

export const ${camelName}: Router = express.Router();

${camelName}
  .get("/", getAll${pascalName})
  .post("/", validateBody(Create${pascalName}Schema), create${pascalName})
  .put(
    "/:id",
    validateParams(${pascalName}IdSchema),
    validateBody(Update${pascalName}Schema),
    update${pascalName}
  )
  .delete("/:id", validateParams(${pascalName}IdSchema), delete${pascalName});
`;
};

// Generate service template
const generateService = (moduleName) => {
  const pascalName = toPascalCase(moduleName);
  return `import type { Create${pascalName}, Update${pascalName} } from "@/api/${moduleName}/${moduleName}.schema";
import type { RequestHandler } from "express";

export const getAll${pascalName}: RequestHandler = async (req, res) => {
  try {
    // TODO: Implement database query
    // const ${moduleName}s = await db.${moduleName}.find();
    
    res.status(200).json({
      status: 200,
      message: "${pascalName}s fetched successfully",
      data: [],
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

export const create${pascalName}: RequestHandler<{}, any, Create${pascalName}> = async (
  req,
  res
) => {
  try {
    // TODO: Implement database creation
    // const ${moduleName} = await db.${moduleName}.create(req.body);

    res.status(201).json({
      status: 201,
      message: "${pascalName} created successfully",
      data: req.body,
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

export const update${pascalName}: RequestHandler<
  { id: string },
  any,
  Update${pascalName}
> = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement database update
    // const ${moduleName} = await db.${moduleName}.findByIdAndUpdate(id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });

    res.status(200).json({
      status: 200,
      message: "${pascalName} updated successfully",
      data: { id, ...req.body },
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

export const delete${pascalName}: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement database deletion
    // const ${moduleName} = await db.${moduleName}.findByIdAndDelete(id);

    res.status(200).json({
      status: 200,
      message: "${pascalName} deleted successfully",
      data: { id },
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
const generateSchema = (moduleName) => {
  const pascalName = toPascalCase(moduleName);
  return `import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Base ${moduleName} schema
export const ${pascalName}Schema = z.object({
  _id: z.string().openapi({ description: "${pascalName} ID" }),
  name: z
    .string()
    .min(1, "Name is required")
    .openapi({ description: "${pascalName} name" }),
  createdAt: z.date().optional().openapi({ description: "Creation timestamp" }),
  updatedAt: z
    .date()
    .optional()
    .openapi({ description: "Last update timestamp" }),
});

// Schema for creating a ${moduleName} (without _id, createdAt, updatedAt)
export const Create${pascalName}Schema = ${pascalName}Schema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
}).openapi("Create${pascalName}");

// Schema for updating a ${moduleName} (all fields optional)
export const Update${pascalName}Schema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
  })
  .openapi("Update${pascalName}");

// Schema for ${moduleName} ID parameter
export const ${pascalName}IdSchema = z
  .object({
    id: z
      .string()
      .min(1, "${pascalName} ID is required")
      .openapi({ description: "${pascalName} ID" }),
  })
  .openapi("${pascalName}IdParam");

// Response schemas
export const ${pascalName}ResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: ${pascalName}Schema.nullable(),
  })
  .openapi("${pascalName}Response");

export const ${pascalName}sResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.array(${pascalName}Schema),
  })
  .openapi("${pascalName}sResponse");

export const ErrorResponseSchema = z
  .object({
    status: z.number(),
    message: z.string(),
    data: z.null(),
  })
  .openapi("ErrorResponse");

// Type exports
export type ${pascalName} = z.infer<typeof ${pascalName}Schema>;
export type Create${pascalName} = z.infer<typeof Create${pascalName}Schema>;
export type Update${pascalName} = z.infer<typeof Update${pascalName}Schema>;
export type ${pascalName}Response = z.infer<typeof ${pascalName}ResponseSchema>;
export type ${pascalName}sResponse = z.infer<typeof ${pascalName}sResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
`;
};

async function main() {
  try {
    console.log("🚀 Module Generator for JobSphere API\n");

    const moduleName = await question(
      "Enter module name (e.g., user, job, booking): "
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
        content: generateController(cleanModuleName),
      },
      {
        name: `${cleanModuleName}.service.ts`,
        content: generateService(cleanModuleName),
      },
      {
        name: `${cleanModuleName}.schema.ts`,
        content: generateSchema(cleanModuleName),
      },
    ];

    for (const file of files) {
      const filePath = join(modulePath, file.name);
      await writeFile(filePath, file.content, "utf-8");
      console.log(`✅ Created file: src/api/${cleanModuleName}/${file.name}`);
    }

    console.log(`\n🎉 Module "${cleanModuleName}" created successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(
      `   1. Create the database model in src/db for "${cleanModuleName}"`
    );
    console.log(`   2. Register the route in src/app.ts`);
    console.log(
      `   3. Customize the schema fields in ${cleanModuleName}.schema.ts`
    );
    console.log(`   4. Add business logic in ${cleanModuleName}.service.ts\n`);
  } catch (error) {
    console.error("❌ Error creating module:", error.message);
    process.exit(1);
  } finally {
    readline.close();
  }
}

main();
