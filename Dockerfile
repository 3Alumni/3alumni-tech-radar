FROM node:22-bookworm-slim
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json server/tsconfig.build.json ./
COPY server/src ./src
COPY server/scripts ./scripts
COPY server/migrations ./migrations
COPY config ./config
RUN npm run build
ENV NODE_ENV=production
CMD ["sh", "-c", "node scripts/migrate.mjs && node dist/main.js"]
