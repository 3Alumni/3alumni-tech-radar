import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";
import { completeJson } from "../src/ai/openai.client.ts";

loadEnv(resolve(process.cwd(), ".env"));
loadEnv(resolve(process.cwd(), "../.env"));

const model = process.env.SKILL_MODEL ?? "gpt-6-luna";
const escoCache = new Map();
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
});
await db.connect();

const postings = await db.query(
  `SELECT p.id, p.role, p.title, p.snippet
   FROM postings p
   WHERE NOT EXISTS (
     SELECT 1 FROM skill_runs r WHERE r.posting_id = p.id AND r.model = $1
   )
   ORDER BY p.id`,
  [model],
);
console.log(`pending ${postings.rows.length} with ${model}`);

for (const posting of postings.rows) {
  const names = await extractSkills(posting.title, posting.snippet ?? "");
  const rows = [];
  for (const name of names) {
    const hit = await findEsco(name);
    if (hit) {
      rows.push({ name, bucket: "esco", escoLabel: hit.label, escoUri: hit.uri });
      continue;
    }
    const bucket = await classifyUnknown(name);
    rows.push({ name, bucket, escoLabel: null, escoUri: null });
  }
  try {
    await db.query("BEGIN");
    for (const row of rows) {
      await db.query(
        `INSERT INTO extracted_skills (posting_id, model, name, bucket, esco_label, esco_uri)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [posting.id, model, row.name, row.bucket, row.escoLabel, row.escoUri],
      );
    }
    await db.query("INSERT INTO skill_runs (posting_id, model) VALUES ($1, $2)", [posting.id, model]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
  console.log(
    posting.id,
    posting.role,
    rows.map((row) => `${row.name} [${row.bucket}]`).join(", ") || "(none)",
  );
}

await db.end();
console.log("done", postings.rows.length);

async function extractSkills(title, snippet) {
  const parsed = await completeJson({
    model,
    system:
      'Return JSON {"skills":["..."]}. List only concrete tools, programming languages, frameworks, and professional skills explicitly required in the text. One short name per item. Split combined names like PHP/Slim/Doctrine into separate items. Do not invent. Do not include job titles, cities, companies, degrees, spoken languages, soft traits, or sentence fragments. Job titles such as Data Analyst, IT-Support, ICT-Supporter, and Web Developer are not skills.',
    user: `Title: ${title}\n\nText: ${snippet}`,
  });
  const skills = Array.isArray(parsed.skills) ? parsed.skills : [];
  return [...new Set(skills.map((item) => String(item).trim()).filter(Boolean))];
}

async function classifyUnknown(skill) {
  const parsed = await completeJson({
    model,
    system:
      'The name was not found in ESCO. Return JSON {"decision":"new"} if it is a real technology, product, programming tool, framework, or teachable professional skill. Return {"decision":"drop"} if it is a job title, city, company, generic word, sentence fragment, or junk.',
    user: skill,
  });
  return parsed.decision === "new" ? "new" : "drop";
}

async function findEsco(skill) {
  const key = normalize(skill);
  if (escoCache.has(key)) {
    return escoCache.get(key);
  }
  let hit = null;
  for (const language of ["en", "de"]) {
    const url = new URL("https://ec.europa.eu/esco/api/search");
    url.searchParams.set("text", skill);
    url.searchParams.set("type", "skill");
    url.searchParams.set("language", language);
    url.searchParams.set("limit", "5");
    url.searchParams.set("full", "true");
    url.searchParams.set("selectedVersion", "v1.2.0");
    const data = await (await fetch(url)).json();
    for (const result of data._embedded?.results ?? []) {
      const preferred = ["en", "de", "fr"].some(
        (code) => result.preferredLabel?.[code] && normalize(result.preferredLabel[code]) === key,
      );
      if (preferred) {
        hit = { label: result.preferredLabel?.en ?? result.title, uri: result.uri };
        break;
      }
    }
    if (hit) {
      break;
    }
  }
  escoCache.set(key, hit);
  return hit;
}

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
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
