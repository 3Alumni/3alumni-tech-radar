import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";
import { completeJson as openAiJson } from "../src/ai/openai.client.ts";
import { completeJson as ollamaJson } from "../src/ai/ollama.client.ts";

loadEnv(resolve(process.cwd(), ".env"));
loadEnv(resolve(process.cwd(), "../.env"));

const model = process.env.SKILL_MODEL ?? "gpt-5.4-mini";
const limit = Number(process.env.SKILL_SAMPLE ?? 10);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
});
await client.connect();
const postings = await client.query(
  `SELECT id, role, title, snippet
   FROM (
     SELECT id, role, title, snippet,
            row_number() OVER (PARTITION BY role ORDER BY length(snippet) DESC, id) AS n
     FROM postings
     WHERE snippet IS NOT NULL AND length(snippet) > 180
   ) ranked
   WHERE n <= 4
   ORDER BY role, id`,
);
await client.end();

const escoCache = new Map();
const rows = [];
for (const posting of postings.rows) {
  const skills = await extractSkills(posting.title, posting.snippet);
  const placed = [];
  for (const skill of skills) {
    const hit = await findEsco(skill);
    if (hit) {
      placed.push({ skill, bucket: "esco", esco: hit.label, uri: hit.uri });
      continue;
    }
    const decision = await classifyUnknown(skill);
    placed.push({ skill, bucket: decision, esco: null, uri: null });
  }
  rows.push({
    id: posting.id,
    role: posting.role,
    title: posting.title,
    snippet: posting.snippet.replace(/\s+/g, " ").slice(0, 500),
    skills: placed,
  });
  console.log(
    posting.role,
    posting.title,
    "->",
    placed.map((item) => `${item.skill} [${item.bucket}]`).join(", ") || "(none)",
  );
}

const slug = model.replace(/[^a-z0-9.]+/gi, "-");
const out = new URL(`../data/skill-review-${slug}.json`, import.meta.url);
writeFileSync(out, JSON.stringify({ model, rows }, null, 2));
console.log("wrote", rows.length, "with", model);

async function extractSkills(title, snippet) {
  const messages = [
    {
      role: "system",
      content:
            "Return JSON {\"skills\":[\"...\"]}. List only concrete tools, programming languages, frameworks, and professional skills explicitly required in the text. One short name per item. Split combined names like PHP/Slim/Doctrine into separate items. Do not invent. Do not include job titles, cities, companies, degrees, spoken languages, soft traits, or sentence fragments. Job titles such as Data Analyst, IT-Support, ICT-Supporter, and Web Developer are not skills.",
    },
    { role: "user", content: `Title: ${title}\n\nText: ${snippet}` },
  ];
  const content = await ask({ messages });
  const skills = Array.isArray(content.skills) ? content.skills : [];
  return [...new Set(skills.map((item) => String(item).trim()).filter(Boolean))];
}

async function classifyUnknown(skill) {
  const parsed = await ask({
    system:
      "The name was not found in ESCO. Return JSON {\"decision\":\"new\"} if it is a real technology, product, programming tool, framework, or teachable professional skill. Return {\"decision\":\"drop\"} if it is a job title, city, company, generic word, sentence fragment, or junk. Do not invent a category.",
    user: skill,
  });
  return parsed.decision === "new" ? "new" : "drop";
}

function ask(input) {
  const client = model.startsWith("gpt-") ? openAiJson : ollamaJson;
  return client({ model, ...input });
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

async function findEsco(skill) {
  const key = skill.toLowerCase();
  if (escoCache.has(key)) {
    return escoCache.get(key);
  }
  const url = new URL("https://ec.europa.eu/esco/api/search");
  url.searchParams.set("text", skill);
  url.searchParams.set("type", "skill");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "5");
  url.searchParams.set("full", "true");
  url.searchParams.set("selectedVersion", "v1.2.0");
  const data = await (await fetch(url)).json();
  const norm = (value) => value.toLowerCase().replace(/\s+/g, " ").trim();
  let hit = null;
  for (const result of data._embedded?.results ?? []) {
    const labels = [];
    for (const language of ["en", "de", "fr"]) {
      if (result.preferredLabel?.[language]) {
        labels.push(result.preferredLabel[language]);
      }
      labels.push(...(result.alternativeLabel?.[language] ?? []));
    }
    if (labels.some((label) => norm(label) === norm(skill))) {
      hit = { label: result.preferredLabel?.en ?? result.title, uri: result.uri };
      break;
    }
  }
  escoCache.set(key, hit);
  return hit;
}
