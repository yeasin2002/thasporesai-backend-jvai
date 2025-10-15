# providus_org

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Express, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Express** - Fast, unopinionated web framework
- **Node.js** - Runtime environment
- **Mongoose** - TypeScript-first ORM
- **MongoDB** - Database engine
- **Zod** - Runtime type validation and schema generation
- **OpenAPI** - Automatic API documentation generation
- **Swagger UI** - Interactive API documentation
- **Husky** - Git hooks for code quality

## Getting Started

First, install the dependencies:

```bash
pnpm install
```
## Database Setup

This project uses MongoDB with Mongoose.

1. Make sure you have MongoDB set up.
2. Update your `apps/server/.env` file with your MongoDB connection URI.

3. Apply the schema to your database:
```bash
pnpm db:push
```


Then, run the development server:

```bash
pnpm dev
```

The API is running at [http://localhost:4000](http://localhost:4000).

## API Documentation

This project includes automatic OpenAPI documentation generation with Swagger UI.

- **Swagger UI**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **OpenAPI JSON**: [http://localhost:4000/api-docs.json](http://localhost:4000/api-docs.json)

### API Validation

All API endpoints include request validation using Zod schemas:

- **Request body validation** - Validates JSON payloads
- **Parameter validation** - Validates URL parameters
- **Type safety** - Full TypeScript integration
- **Error responses** - Detailed validation error messages

### User API Endpoints

- `GET /api/user` - Get all users
- `POST /api/user` - Create a new user
- `PUT /api/user/:id` - Update a user by ID
- `DELETE /api/user/:id` - Delete a user by ID







## Project Structure

```
providus_org/
├── apps/
│   └── server/      # Backend API (Express)
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI
