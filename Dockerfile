# Dockerfile for Railway deployment (avoids Nixpacks cache locking issues)

FROM node:20.19.0

WORKDIR /app

# Copy package metadata and install dependencies first to leverage layer caching
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# Run the built Nest app
CMD ["node", "dist/main.js"]
