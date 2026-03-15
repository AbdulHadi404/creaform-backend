# Dockerfile for Railway deployment (avoids Nixpacks cache locking issues)

FROM node:20.19.0

WORKDIR /app

# Copy package metadata and install dependencies first to leverage layer caching
COPY package.json package-lock.json ./
# Ensure dev dependencies are installed for build (Railway sets NODE_ENV=production during build)
ENV NODE_ENV=development
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build
RUN ls -la dist && ls -la dist/src || true

# Run the built Nest app
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
