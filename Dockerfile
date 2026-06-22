FROM node:22-slim AS build

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install --prefix server && npm install --prefix client

COPY client ./client
COPY server ./server

RUN npm run build --prefix client

FROM node:22-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./server/
RUN npm install --omit=dev --prefix server

COPY server ./server
COPY --from=build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/server/data/ajaia-docs.db

EXPOSE 3001

CMD ["node", "server/index.js"]
