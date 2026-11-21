import { existsSync, readFileSync, statSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(resolve(root, ".env"));
loadEnv(resolve(root, "../.env"));

const fileArg = process.argv[2];
const role = readFlag("--role");
const query = readFlag("--query");
const lang = readFlag("--lang");
if (!fileArg || !role || !query || !lang) {
  throw new Error(
    "usage: node scripts/import-adzuna-file.mjs <file.json> --role <role-id> --query <text> --lang <de|en>",
  );
}

const filePath = resolve(process.cwd(), fileArg);
const data = JSON.parse(readFileSync(filePath, "utf8"));
const results = data.results ?? [];
if (typeof data.count !== "number") {
  throw new Error("Adzuna file has no count");
}

const fetchedAt = statSync(filePath).mtime.toISOString();
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
});

await client.connect();
try {
  for (const result of results) {
    if (!result.id || !result.title || !result.redirect_url) {
      throw new Error("A result is missing id, title, or redirect_url");
    }
  }
  const existing = await client.query(
    "SELECT 1 FROM metrics WHERE source_id = 'adzuna' AND role = $1 AND label = $2 AND period = $3",
    [role, query, lang],
  );
  if (existing.rowCount > 0) {
    console.log(`already imported ${role} ${lang}, nothing written`);
    process.exit(0);
  }

  await client.query("BEGIN");
  const snapshot = await client.query(
    "INSERT INTO snapshots (source_id, fetched_at) VALUES ('adzuna', $1) RETURNING id",
    [fetchedAt],
  );
  const snapshotId = snapshot.rows[0].id;
  await client.query(
    `INSERT INTO metrics
      (snapshot_id, label, value, unit, question, role, geo, period, source_id, source_url, fetched_at)
     VALUES ($1, $2, $3, 'postings', 'A', $4, 'CH', $5, 'adzuna', 'https://www.adzuna.ch/', $6)`,
    [snapshotId, query, String(data.count), role, lang, fetchedAt],
  );
  for (const result of results) {
    await client.query(
      `INSERT INTO postings
        (snapshot_id, source_id, external_id, role, title, company, location, url, snippet,
         fetched_at, location_area, category_tag, posted_at, raw)
       VALUES ($1, 'adzuna', $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::jsonb)`,
      [
        snapshotId,
        String(result.id),
        role,
        result.title,
        result.company?.display_name ?? null,
        result.location?.display_name ?? null,
        result.redirect_url,
        result.description ?? null,
        fetchedAt,
        JSON.stringify(result.location?.area ?? []),
        result.category?.tag ?? null,
        result.created ?? null,
        JSON.stringify(result),
      ],
    );
  }
  await client.query("COMMIT");
  console.log(`imported snapshot ${snapshotId}: count ${data.count}, postings ${results.length}`);
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
