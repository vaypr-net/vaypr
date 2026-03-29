# Frontend Dockerfile (React/Vite) - Security Hardened
FROM node:20-alpine AS build
WORKDIR /app

# Update packages for security patches
RUN apk upgrade --no-cache

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Production image with nginx
FROM nginx:alpine

# Update packages for security patches (fix zlib CVE-2026-22184)
RUN apk upgrade --no-cache

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: Add security headers to nginx
RUN echo 'server_tokens off;' > /etc/nginx/conf.d/security.conf

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
