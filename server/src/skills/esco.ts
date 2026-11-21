import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { normalizePhrase } from "./phrases";

const VERSION = "v1.2.0";

export interface EscoHit {
  label: string;
  uri: string;
}

type CacheFile = {
  version: string;
  phrases: Record<string, EscoHit | null>;
};

export function cachePath(): string {
  return resolve(process.cwd(), "data/esco-cache.json");
}

export function loadCache(): Record<string, EscoHit | null> {
  const path = cachePath();
  if (!existsSync(path)) {
    return {};
  }
  const file = JSON.parse(readFileSync(path, "utf8")) as CacheFile;
  return file.phrases ?? {};
}

export function saveCache(phrases: Record<string, EscoHit | null>) {
  const body: CacheFile = { version: VERSION, phrases };
  writeFileSync(cachePath(), JSON.stringify(body));
}

export async function lookupEsco(phrase: string): Promise<EscoHit | null> {
  for (const language of ["en", "de", "fr"]) {
    const hit = await search(phrase, language);
    if (hit) {
      return hit;
    }
  }
  return null;
}

async function search(phrase: string, language: string): Promise<EscoHit | null> {
  const url = new URL("https://ec.europa.eu/esco/api/search");
  url.searchParams.set("text", phrase);
  url.searchParams.set("type", "skill");
  url.searchParams.set("language", language);
  url.searchParams.set("limit", "8");
  url.searchParams.set("full", "true");
  url.searchParams.set("selectedVersion", VERSION);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESCO ${response.status} for ${phrase}`);
  }
  const body = (await response.json()) as {
    _embedded?: { results?: EscoResult[] };
  };
  for (const result of body._embedded?.results ?? []) {
    if (labels(result).some((label) => normalizePhrase(label) === normalizePhrase(phrase))) {
      return {
        label: result.preferredLabel?.en ?? result.title,
        uri: result.uri,
      };
    }
  }
  return null;
}

interface EscoResult {
  title: string;
  uri: string;
  preferredLabel?: Record<string, string>;
  alternativeLabel?: Record<string, string[]>;
}

function labels(result: EscoResult): string[] {
  const values: string[] = [];
  for (const language of ["en", "de", "fr"]) {
    const preferred = result.preferredLabel?.[language];
    if (preferred) {
      values.push(preferred);
    }
    values.push(...(result.alternativeLabel?.[language] ?? []));
  }
  return values;
}
