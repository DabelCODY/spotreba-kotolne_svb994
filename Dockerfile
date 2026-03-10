# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/types.ts ./types.ts
COPY --from=builder /app/services ./services

# Create directory for database
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/database.sqlite

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
