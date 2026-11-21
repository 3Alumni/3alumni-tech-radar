import { existsSync, readFileSync, statSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(resolve(root, ".env"));
loadEnv(resolve(root, "../.env"));

const fileArg = process.argv[2];
const category = readFlag("--category");
if (!fileArg || !category) {
  throw new Error("usage: node scripts/import-salary-history.mjs <file.json> --category <tag>");
}

const filePath = resolve(process.cwd(), fileArg);
const data = JSON.parse(readFileSync(filePath, "utf8"));
const months = data.month && typeof data.month === "object" ? Object.entries(data.month) : [];
if (months.length === 0) {
  throw new Error("Salary file has no months");
}

const fetchedAt = statSync(filePath).mtime.toISOString();
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
});

await client.connect();
try {
  const existing = await client.query(
    "SELECT 1 FROM salary_points WHERE category = $1 AND fetched_at = $2 LIMIT 1",
    [category, fetchedAt],
  );
  if (existing.rowCount > 0) {
    console.log(`already imported ${category}, nothing written`);
    process.exit(0);
  }
  await client.query("BEGIN");
  for (const [month, salary] of months) {
    await client.query(
      `INSERT INTO salary_points (category, month, salary, source_id, source_url, fetched_at)
       VALUES ($1, $2, $3, 'adzuna', 'https://www.adzuna.ch/', $4)`,
      [category, `${month}-01`, salary, fetchedAt],
    );
  }
  await client.query("COMMIT");
  console.log(`imported ${months.length} salary months for ${category}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}

function readFlag(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

function loadEnv(path) {
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
