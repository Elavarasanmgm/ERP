# Frontend Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run production build
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]
