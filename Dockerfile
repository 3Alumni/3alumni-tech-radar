FROM node:22-bookworm-slim
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json server/tsconfig.build.json ./
COPY server/src ./src
COPY config ./config
RUN npm run build
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
