# ── dev stage (Vite only, no API) ─────────────────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ── build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── prod stage (Hono API + static frontend) ────────────────────────────────────
FROM node:22-alpine AS prod
WORKDIR /app

# Required for better-sqlite3 native module compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server/ ./server/
COPY src/types/ ./src/types/
COPY tsconfig.server.json ./

RUN mkdir -p /app/data

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npx", "tsx", "server/index.ts"]
