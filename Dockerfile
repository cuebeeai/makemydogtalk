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

# Don't prune dev dependencies because esbuild bundles them into dist/index.js
# The bundled code contains imports that need the modules available at runtime

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "dist/index.js"]
