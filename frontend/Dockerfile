FROM node:20-alpine AS build

WORKDIR /app

# Accept VITE_API_URL as a build arg so docker-compose can set it
# without needing the gitignored .env.production file on the server.
# Default is relative /api/v1 — correct when served behind nginx.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy from the project root context (set in docker-compose)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
