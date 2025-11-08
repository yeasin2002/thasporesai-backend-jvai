# Production-ready Node.js application with minimal footprint
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.18.3

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

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

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p uploads logs

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/app.js"]
