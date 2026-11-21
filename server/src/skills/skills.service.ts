import { Injectable } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { DbService } from "../core/db.service";
import { EscoHit, loadCache } from "./esco";
import { normalizePhrase, phrasesFromPosting, technical } from "./phrases";

interface PostingRow {
  role: string;
  title: string;
  snippet: string | null;
  source_url: string | null;
  fetched_at: Date;
}

interface SkillCount {
  phrase: string;
  count: number;
  roles: Map<string, number>;
}

export interface SkillMatch {
  label: string;
  esco: string | null;
  count: number;
  roles: Record<string, number>;
}

export interface UnmatchedSkill {
  phrase: string;
  count: number;
  roles: Record<string, number>;
}

@Injectable()
export class SkillsService {
  constructor(
    private readonly db: DbService,
    private readonly config: ConfigService,
  ) {}

  match(phrase: string): { label: string; esco?: string } | null {
    const mapping = this.config
      .synonyms()
      .find((item) => normalizePhrase(item.phrase) === normalizePhrase(phrase));
    if (!mapping) {
      return null;
    }
    return { label: mapping.label, esco: mapping.esco };
  }

  async list(role?: string): Promise<{
    basis: {
      postings: number;
      text: string;
      sourceId: string;
      sourceUrl: string;
      dictionary: string;
      dictionaryUrl: string;
    };
    matched: SkillMatch[];
    unmatched: UnmatchedSkill[];
  }> {
    const postings = await this.db.pool.query<PostingRow>(
      `SELECT role, title, snippet,
              (SELECT source_url FROM metrics WHERE snapshot_id = postings.snapshot_id LIMIT 1) AS source_url,
              fetched_at
       FROM postings
       WHERE ($1::text IS NULL OR role = $1)`,
      [role ?? null],
    );
    const counts = new Map<string, SkillCount>();
    for (const posting of postings.rows) {
      const seen = new Set<string>();
      for (const phrase of phrasesFromPosting(posting.title, posting.snippet ?? "")) {
        const key = normalizePhrase(phrase);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const current = counts.get(key) ?? { phrase, count: 0, roles: new Map() };
        current.count += 1;
        current.roles.set(posting.role, (current.roles.get(posting.role) ?? 0) + 1);
        counts.set(key, current);
      }
    }

    const cache = loadCache();
    const matched: SkillMatch[] = [];
    const unmatched: UnmatchedSkill[] = [];
    for (const [key, count] of counts) {
      const roles = Object.fromEntries(count.roles);
      const synonym = this.match(count.phrase);
      const esco = cache[key] as EscoHit | null | undefined;
      if (synonym) {
        pushMatch(matched, synonym.label, synonym.esco ?? null, count.count, roles);
        continue;
      }
      if (esco) {
        pushMatch(matched, esco.label, esco.uri, count.count, roles);
        continue;
      }
      if (technical(count.phrase)) {
        unmatched.push({ phrase: count.phrase, count: count.count, roles });
      }
    }

    matched.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    unmatched.sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));
    const sourceUrl = postings.rows.find((row) => row.source_url)?.source_url ?? "https://www.adzuna.ch/";
    return {
      basis: {
        postings: postings.rows.length,
        text: "title and description snippet",
        sourceId: "adzuna",
        sourceUrl,
        dictionary: "ESCO v1.2.0",
        dictionaryUrl: "https://esco.ec.europa.eu/en/classification/skill_main",
      },
      matched,
      unmatched,
    };
  }
}

function pushMatch(
  matched: SkillMatch[],
  label: string,
  esco: string | null,
  count: number,
  roles: Record<string, number>,
) {
  const existing = matched.find((item) => item.label === label && item.esco === esco);
  if (!existing) {
    matched.push({ label, esco, count, roles });
    return;
  }
  existing.count += count;
  for (const [role, value] of Object.entries(roles)) {
    existing.roles[role] = (existing.roles[role] ?? 0) + value;
  }
}
