# Nafura Frontend - Multi-stage Docker build
# 
# Build:
#   docker build -t nafura-frontend:dev .
#   docker build -t nafura-frontend:dev --build-arg CONFIGURATION=production .
#
# Run:
#   docker run -p 80:80 nafura-frontend:dev

# ============================================
# Stage 1: Build Angular application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and build
COPY . .

# Build argument for environment (development/production)
ARG CONFIGURATION=production
RUN rm -rf dist/project-fountain && npm run build -- --configuration=${CONFIGURATION}

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
# Angular 17+ outputs to dist/<project-name>/browser for SSR-ready builds
COPY --from=build /app/dist/project-fountain/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
