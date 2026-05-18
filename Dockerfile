# Stage 1: Build the frontend application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Vite application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration template
# nginx:alpine will automatically process this with envsubst and put it in /etc/nginx/conf.d/
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Default API Gateway URL (can be overridden at runtime)
ENV API_GATEWAY_URL=http://api-gateway:8080

# Expose port 80 for Nginx
EXPOSE 80

# The base nginx:alpine image already has the correct ENTRYPOINT and CMD to start Nginx.
