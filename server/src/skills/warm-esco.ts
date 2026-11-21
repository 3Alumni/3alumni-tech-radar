import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";
import { cachePath, loadCache, lookupEsco, saveCache } from "./esco";
import { normalizePhrase, phrasesFromPosting } from "./phrases";

async function main() {
  loadEnv();
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://radar:radar@localhost:5433/radar",
  });
  await client.connect();
  const postings = await client.query<{ title: string; snippet: string | null }>(
    "SELECT title, snippet FROM postings",
  );
  await client.end();

  const phrases = new Map<string, string>();
  for (const posting of postings.rows) {
    for (const phrase of phrasesFromPosting(posting.title, posting.snippet ?? "")) {
      const key = normalizePhrase(phrase);
      if (!phrases.has(key)) {
        phrases.set(key, phrase);
      }
    }
  }

  const cache = loadCache();
  let calls = 0;
  for (const [key, phrase] of phrases) {
    if (key in cache) {
      continue;
    }
    cache[key] = await lookupEsco(phrase);
    calls += 1;
    if (calls % 25 === 0) {
      saveCache(cache);
      console.log(`looked up ${calls}`);
    }
  }
  saveCache(cache);
  const matched = Object.values(cache).filter((hit) => hit !== null).length;
  console.log(`cache ${cachePath()}`);
  console.log(`phrases ${phrases.size}, new lookups ${calls}, matched ${matched}`);
}

function loadEnv() {
  for (const path of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../.env")]) {
    if (!existsSync(path)) {
      continue;
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
}

void main();
