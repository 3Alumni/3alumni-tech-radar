FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM node:22-bookworm-slim
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
