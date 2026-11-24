FROM node:24-alpine

WORKDIR /app

# Dependency list first, so Docker reuses the npm ci layer until it changes.
COPY package*.json ./
RUN npm ci

COPY . .

# Compile once at build time; the API container runs dist/main.
RUN npm run build
