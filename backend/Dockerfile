# Development Dockerfile for NestJS Backend
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Remove local .env file to use Docker environment variables
RUN rm -f .env

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "start:dev"]