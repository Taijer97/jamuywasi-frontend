# ==============================================================
#  JamuyWasi Frontend — compila con Node y sirve con Nginx
# ==============================================================

# ---------- 1) Compilación ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- 2) Servidor web ----------
FROM nginx:1.27-alpine

# La plantilla se procesa al arrancar: sustituye ${API_UPSTREAM}
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Carpeta para la caché de imágenes
RUN mkdir -p /var/cache/nginx/media && chown -R nginx:nginx /var/cache/nginx/media

ENV API_UPSTREAM=http://backend:8000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1
