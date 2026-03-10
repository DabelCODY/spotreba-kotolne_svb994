FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/types.ts ./types.ts
COPY --from=builder /app/services ./services

RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/database.sqlite
ENV PORT=80
ENV NODE_ENV=production

EXPOSE 80
CMD ["npx", "tsx", "server.ts"]
