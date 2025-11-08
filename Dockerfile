# Multi-stage build for production-ready Node.js application
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.18.3

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# ================================
# Development stage
# ================================
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start development server with hot reload
CMD ["pnpm", "dev"]

# ================================
# Build stage
# ================================
FROM base AS builder

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Type check
RUN pnpm check-types

# ================================
# Production stage
# ================================
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.18.3

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY --from=builder /app/firebase-service-account.json* ./

# Create uploads directory
RUN mkdir -p uploads logs

# Set NODE_ENV
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/app.js"]
