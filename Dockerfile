# ==============================================================================
# DOCKERFILE UNTUK BIZNET NEO CLOUD (FFN ACCOUNTING)
# Domain: ffoodnusantara.site
# ==============================================================================

# Tahap 1: Build Aplikasi React + Vite
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Tahap 2: Nginx Web Server Ringan & Cepat
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Salin konfigurasi SPA routing
RUN echo 'server { \
    listen 80; \
    server_name ffoodnusantara.site www.ffoodnusantara.site localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
