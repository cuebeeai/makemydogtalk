# Use Node.js 20 LTS runtime (full image for build tools)
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev deps for build)
RUN npm ci

# Copy application code
COPY . .

# Build the application with increased memory
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["npm", "start"]
