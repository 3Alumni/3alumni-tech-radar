import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";
import { completeJson } from "../src/ai/openai.client.ts";

loadEnv(resolve(process.cwd(), ".env"));
loadEnv(resolve(process.cwd(), "../.env"));

const model = "gpt-6-luna";
const allowed = ["junior", "internship", "apprenticeship", "part-time", "graduate"];
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
});
await db.connect();

const postings = await db.query(
  `SELECT company, title, snippet
   FROM postings
   WHERE company IS NOT NULL AND btrim(company) <> ''
   ORDER BY company, length(snippet) DESC NULLS LAST`,
);
const byCompany = new Map();
for (const row of postings.rows) {
  const key = row.company.trim().toLowerCase();
  const bucket = byCompany.get(key) ?? { name: row.company.trim(), ads: [] };
  if (bucket.ads.length < 8) {
    bucket.ads.push({ title: row.title, text: (row.snippet ?? "").slice(0, 500) });
  }
  byCompany.set(key, bucket);
}

let done = 0;
for (const [key, company] of byCompany) {
  const seen = await db.query(
    "SELECT 1 FROM company_tag_runs WHERE company_key = $1 AND model = $2",
    [key, model],
  );
  if (seen.rowCount > 0) {
    continue;
  }
  const body = company.ads
    .map((ad, index) => `Ad ${index + 1}\nTitle: ${ad.title}\nText: ${ad.text}`)
    .join("\n\n");
  let tags = [];
  try {
    const result = await completeJson({
      system:
        'Return JSON {"tags":[{"tag":"junior","evidence":"short quote"}]}. ' +
        `Choose at most 3 tags from this list only: ${allowed.join(", ")}. ` +
        "Add a tag only when the ad explicitly offers that kind of role. " +
        "junior means the word junior or an entry-level hire. " +
        "internship means Praktikum, stage, or internship. " +
        "apprenticeship means Lehre, Lehrstelle, or apprenticeship. " +
        "part-time means a part-time workload such as 40-80% or Teilzeit. " +
        "graduate means a role for new graduates or Berufseinsteiger. " +
        "If the text does not say it, return an empty list. Do not invent.",
      user: `Company: ${company.name}\n\n${body}`,
    });
    const picked = new Set();
    for (const item of result.tags ?? []) {
      const tag = String(item.tag ?? "").toLowerCase().trim();
      if (!allowed.includes(tag) || picked.has(tag) || picked.size >= 3) {
        continue;
      }
      picked.add(tag);
      tags.push({ tag, evidence: String(item.evidence ?? "").slice(0, 240) });
    }
  } catch (error) {
    console.log(`fail ${company.name}: ${error instanceof Error ? error.message : error}`);
    continue;
  }
  await db.query("BEGIN");
  let position = 1;
  for (const tag of tags) {
    await db.query(
      `INSERT INTO company_tags (company_key, model, tag, position, evidence)
       VALUES ($1, $2, $3, $4, $5)`,
      [key, model, tag.tag, position, tag.evidence || null],
    );
    position += 1;
  }
  await db.query(
    "INSERT INTO company_tag_runs (company_key, model) VALUES ($1, $2)",
    [key, model],
  );
  await db.query("COMMIT");
  done += 1;
  console.log(`${company.name}: ${tags.map((tag) => tag.tag).join(", ") || "none"}`);
}
console.log(`tagged ${done}`);
await db.end();

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
