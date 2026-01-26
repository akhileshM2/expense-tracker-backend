# --- Stage 1: Build ---
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm install
RUN npm install typescript

# Copy the rest of your source code
COPY . .

# Generate Prisma Client and build the TypeScript project
RUN npm run db:generate
RUN npm run build

# --- Stage 2: Runner ---
FROM node:24-alpine AS runner

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Set environment to production
ENV NODE_ENV=production

# Expose the port your backend runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]