# zod-to-openapi — guide & example

A concise, practical reference for using `@asteasolutions/zod-to-openapi` to:

* maintain **one source of truth** (Zod schemas) for both runtime validation and OpenAPI docs.
* generate an OpenAPI v3 document from your Zod schemas.
* use the same schemas to validate Express requests.

This file is meant to be used as a quick reference or instruction set for Copilot / Cursor / Kiro assistants. Keep schemas central, descriptive, and versioned.

---

## Table of contents

1. Installation
2. Project structure (recommended)
3. Setup: enable OpenAPI helpers in Zod
4. Example: reusable user schemas
5. Use schemas for Express validation
6. Build OpenAPI spec (registry + paths)
7. Serve docs with Swagger UI
8. Generate JSON/YAML in a build/CI step
9. Best practices and tips
10. Quick reference table
11. Copilot / Cursor / Kiro instruction rules

---

# 1. Installation

```bash
npm install zod @asteasolutions/zod-to-openapi express zod-express-middleware swagger-ui-express
# or
yarn add zod @asteasolutions/zod-to-openapi express zod-express-middleware swagger-ui-express
```

You may already have `express` in the project. Install `zod-express-middleware` (or similar) to validate incoming requests with the same Zod schemas.

---

# 2. Recommended project structure

```
src/
├─ validations/
│  └─ user.validation.ts     # all user-related schemas live here
├─ routes/
│  └─ user.route.ts
├─ openapi/
│  └─ registry.ts            # register schemas and path definitions
├─ server.ts
package.json
```

Keep all validation schemas in one place so they can be shared by runtime code and the OpenAPI generator.

---

# 3. Setup: enable OpenAPI helpers in Zod

Call `extendZodWithOpenApi(z)` once at application startup or in the validation module so you can annotate schemas with `.openapi(...)`.

```ts
// src/validations/_zod-openapi-setup.ts
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);
export { z };
```

Then import `z` from this file in your validation files. This avoids repeating the extension step.

---

# 4. Example: reusable user schemas

Create schemas that describe `body`, `params`, `query`, etc. Export the Zod objects so both the middleware and the OpenAPI registry can use them.

```ts
// src/validations/user.validation.ts
import { z } from "../validations/_zod-openapi-setup"; // our extended z

export const CreateUserBody = z.object({
  name: z.string().min(2).openapi({ example: "Jane Doe", description: "Full name" }),
  email: z.string().email().openapi({ example: "jane@example.com" }),
  password: z.string().min(6).openapi({ description: "Plain-text password (hashed on server)" }),
});

export const LoginUserBody = z.object({
  email: z.string().email().openapi({ example: "jane@example.com" }),
  password: z.string().min(6),
});

// For zod-express-middleware it's convenient to wrap with top-level keys
export const CreateUserSchema = z.object({ body: CreateUserBody });
export const LoginUserSchema = z.object({ body: LoginUserBody });

export default {
  CreateUserSchema,
  LoginUserSchema,
  CreateUserBody,
  LoginUserBody,
};
```

Notes:

* Keep `body`, `params`, and `query` separate so OpenAPI and runtime validators can reference the exact sub-schema.
* Use `.openapi({ example, description })` to add examples and descriptions that appear in Swagger UI.

---

# 5. Use schemas for Express validation

`zod-express-middleware` accepts a Zod schema describing `body`, `params` or `query`. Use the same exported schemas.

```ts
// src/routes/user.route.ts
import express from "express";
import { validateRequest, setResponseValidationErrorHandler } from "zod-express-middleware";
import UserValidation from "../validations/user.validation";

const router = express.Router();

// Optional: global custom error format
setResponseValidationErrorHandler((err, req, res, next) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
  });
});

router.post("/register", validateRequest(UserValidation.CreateUserSchema), (req, res) => {
  // At this point req.body is typed and validated
  const { name, email } = req.body;
  res.json({ success: true, user: { name, email } });
});

router.post("/login", validateRequest(UserValidation.LoginUserSchema), (req, res) => {
  res.json({ success: true });
});

export default router;
```

Behavior when validation fails:

* Default response: `{ status: "failed", errors: [ ... ] }` with a `400` status code.
* You can override the format with `setResponseValidationErrorHandler`.

---

# 6. Build OpenAPI spec (registry + paths)

Use `OpenAPIRegistry` to register schemas and `registerPath` to register operations. Then generate the document with `OpenApiGeneratorV3`.

```ts
// src/openapi/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import UserValidation from "../validations/user.validation";

const registry = new OpenAPIRegistry();

// Register component schemas (use sub-schemas, e.g. the body object)
registry.register("CreateUser", UserValidation.CreateUserBody);
registry.register("LoginUser", UserValidation.LoginUserBody);

// Register path with request/response schemas
registry.registerPath({
  method: "post",
  path: "/api/users/register",
  request: {
    body: {
      content: {
        "application/json": { schema: UserValidation.CreateUserBody },
      },
    },
  },
  responses: {
    200: { description: "User registered" },
    400: { description: "Bad Request" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/users/login",
  request: {
    body: {
      content: {
        "application/json": { schema: UserValidation.LoginUserBody },
      },
    },
  },
  responses: { 200: { description: "Logged in" } },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: { title: "My API", version: "1.0.0" },
});

export default registry;
```

Important notes:

* Register component schemas with `registry.register(name, schema)` when you want them to appear in `components/schemas`.
* When adding references in `registerPath`, you can pass the same Zod schema. The generator will use the definition.

---

# 7. Serve docs with Swagger UI

```ts
// src/server.ts
import express from "express";
import swaggerUi from "swagger-ui-express";
import userRoutes from "./routes/user.route";
import { openApiDocument } from "./openapi/registry";

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.listen(4000, () => console.log("Server running http://localhost:4000 docs at /docs"));
```

Now `/docs` will show a Swagger UI built from your Zod schemas.

---

# 8. Generate JSON/YAML in a build/CI step

Add a script to generate and write the OpenAPI document to disk so CI or other tools can pick it up.

```ts
// scripts/generate-openapi.ts
import fs from "fs";
import { openApiDocument } from "../src/openapi/registry";

fs.writeFileSync("./openapi.json", JSON.stringify(openApiDocument, null, 2), "utf8");
console.log("openapi.json generated");
```

Add to `package.json`:

```json
"scripts": {
  "build:openapi": "ts-node scripts/generate-openapi.ts"
}
```

Run `npm run build:openapi` in your pipeline and commit the generated file or upload it to your API portal.

---

# 9. Best practices and tips

* **One source of truth:** Keep Zod schemas in a single folder and import them where needed.
* **Annotate schemas:** Use `.openapi({ example, description, nullable })` for useful Swagger UI docs.
* **Prefer small sub-schemas:** Export `CreateUserBody` separately rather than embedding nested objects only inside the route schema.
* **Type awareness:** When using TypeScript, derive `type CreateUser = z.infer<typeof CreateUserBody>` for typed service layers.
* **Register before serving:** Ensure `registry.register(...)` calls run before generating the document.
* **Version your API:** Add `info.version` and consider `servers` in the generated document.
* **Reuse components:** Register shared objects like `ErrorResponse` or `Pagination` so they appear under `components/schemas`.

Example shared error schema:

```ts
// src/openapi/components.ts
import { z } from "../validations/_zod-openapi-setup";
export const ErrorResponse = z.object({
  status: z.literal("error"),
  message: z.string(),
});
```

Register it with `registry.register("ErrorResponse", ErrorResponse);` and reference it in `responses`.

---

# 10. Quick reference table

| Task                                 | API / helper                                                         | Notes                                                                |
| ------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Add OpenAPI metadata to a Zod field  | `.openapi({ example, description })`                                 | Call after `extendZodWithOpenApi(z)`                                 |
| Expose schema for Express validation | export `z.object({ body: ... })`                                     | Use with `validateRequest(schema)`                                   |
| Register schema to components        | `registry.register(name, schema)`                                    | Name appears under `components/schemas`                              |
| Add a path                           | `registry.registerPath({ method, path, request, responses })`        | `request.body.content[application/json].schema` accepts a Zod schema |
| Generate document                    | `new OpenApiGeneratorV3(registry.definitions).generateDocument(...)` | Produces OpenAPI v3 document                                         |

---

# 11. Copilot / Cursor / Kiro instruction rules

Use these short rules when an AI assistant edits code or suggests changes:

1. **Always import Zod from `src/validations/_zod-openapi-setup.ts`.** This ensures `.openapi()` helpers are available.
2. **Do not duplicate schemas.** If a route needs `CreateUser`, import `CreateUserBody` or `CreateUserSchema` from `validations/user.validation.ts`.
3. **When adding a new route:**

   * add or reuse a Zod sub-schema (`body`, `params`, `query`) in `validations`.
   * register the sub-schema with `registry.register("Name", schema)` if it should appear in `components`.
   * add `registry.registerPath(...)` with the Zod schema for request/response shape.
4. **Documentation fields:** Always add `description` and `example` when introducing new properties. Keep examples realistic.
5. **Type exports:** Generate and export `type` aliases using `z.infer` for service and controller layers.
6. **Validation error format:** Use `setResponseValidationErrorHandler` in `routes` or once in bootstrap to normalize client-facing errors.
7. **CI step:** Keep a script `scripts/generate-openapi.ts` to produce a stable `openapi.json`. Run it before releasing documentation or API clients.

---

## Troubleshooting

* **Missing examples in Swagger:** Ensure `.openapi(...)` was called and the schema used in `registerPath` is the same Zod object.
* **Schemas not appearing under components:** Call `registry.register("Name", schema)` before generating the document.
* **Type mismatch at runtime:** Use `z.infer<typeof Schema>` to ensure TypeScript types match runtime schema.

---

## Short, copyable example (all pieces)

```
# src/validations/_zod-openapi-setup.ts
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);
export { z };

# src/validations/user.validation.ts
import { z } from "./_zod-openapi-setup";
export const CreateUserBody = z.object({ name: z.string().min(2).openapi({ example: 'Jane' }), email: z.string().email().openapi({ example: 'jane@example.com' }), password: z.string().min(6) });
export const CreateUserSchema = z.object({ body: CreateUserBody });

# src/openapi/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { CreateUserBody } from "../validations/user.validation";
const registry = new OpenAPIRegistry();
registry.register("CreateUser", CreateUserBody);
registry.registerPath({ method: 'post', path: '/api/users/register', request: { body: { content: { 'application/json': { schema: CreateUserBody } } } }, responses: { 200: { description: 'User registered' } } });
export const openApiDocument = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.0', info: { title: 'API', version: '1.0.0' } });

# src/server.ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import userRoutes from './routes/user.route';
import { openApiDocument } from './openapi/registry';
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.listen(4000);
```

---

If you want, I can also:

* generate a ready-to-drop-in `user.validation.ts`, `registry.ts`, and `server.ts` in TypeScript to paste into your repo; or
* create the `scripts/generate-openapi.ts` and a GitHub Actions example to publish `openapi.json` on merge.

Tell me which you prefer and I will create the files.
