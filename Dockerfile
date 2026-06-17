# ── Stage 1: Build the React app ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with NGINX ─────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Snowflake SPCS requires port 8080 (not 80)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
