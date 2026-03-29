# Backend Dockerfile (NestJS) - Security Hardened
FROM node:20-alpine AS build
WORKDIR /app

# Update packages for security patches
RUN apk upgrade --no-cache

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

# Update packages for security patches (fix zlib CVE-2026-22184)
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy only production files
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./

# Security: Run as non-root user
USER nestjs

ENV NODE_ENV=production
ENV PORT=4040

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4040/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 4040

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
