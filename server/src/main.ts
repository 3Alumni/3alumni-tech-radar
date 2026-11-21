import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

loadEnv(resolve(process.cwd(), ".env"));
loadEnv(resolve(process.cwd(), "../.env"));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Fedlex act text is posted to /summaries/act. The default JSON limit is 100 KB.
  app.useBodyParser("json", { limit: "5mb" });
  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
  });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

function loadEnv(path: string) {
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
