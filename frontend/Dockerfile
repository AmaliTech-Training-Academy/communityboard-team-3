# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install pnpm in the image
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source and build
COPY . .
RUN pnpm run build

# Runtime stage (serve built files with nginx)
FROM nginx:alpine

# Copy built assets from vite 
COPY --from=build /app/dist /usr/share/nginx/html


# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
