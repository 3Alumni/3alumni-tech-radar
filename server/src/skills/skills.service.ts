import { Injectable } from "@nestjs/common";
import { DbService } from "../core/db.service";

const MODEL = "gpt-6-luna";

@Injectable()
export class SkillsService {
  constructor(private readonly db: DbService) {}

  async list(role?: string) {
    const [esco, own, skipped, basis] = await Promise.all([
      this.grouped("esco", role),
      this.grouped("new", role),
      this.skipped(role),
      this.basis(role),
    ]);
    return {
      basis: {
        postings: basis.postings,
        model: MODEL,
        text: "title and description snippet",
        sourceId: "adzuna",
        sourceUrl: "https://www.adzuna.ch/",
        dictionary: "ESCO v1.2.0",
        dictionaryUrl: "https://esco.ec.europa.eu/en/classification/skill_main",
        skipped,
      },
      esco,
      own,
    };
  }

  private async grouped(bucket: "esco" | "new", role?: string) {
    const result = await this.db.pool.query<{
      label: string;
      esco_uri: string | null;
      role: string;
      postings: number;
    }>(
      `SELECT COALESCE(s.esco_label, s.name) AS label,
              s.esco_uri,
              p.role,
              count(DISTINCT s.posting_id)::int AS postings
       FROM extracted_skills s
       JOIN postings p ON p.id = s.posting_id
       WHERE s.model = $1 AND s.bucket = $2 AND ($3::text IS NULL OR p.role = $3)
       GROUP BY 1, 2, 3`,
      [MODEL, bucket, role ?? null],
    );
    const skills = new Map<string, { label: string; esco: string | null; count: number; roles: Record<string, number> }>();
    for (const row of result.rows) {
      const key = `${row.label}|${row.esco_uri ?? ""}`;
      const current = skills.get(key) ?? { label: row.label, esco: row.esco_uri, count: 0, roles: {} };
      current.count += row.postings;
      current.roles[row.role] = row.postings;
      skills.set(key, current);
    }
    return [...skills.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  private async skipped(role?: string) {
    const result = await this.db.pool.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM extracted_skills s
       JOIN postings p ON p.id = s.posting_id
       WHERE s.model = $1 AND s.bucket = 'drop' AND ($2::text IS NULL OR p.role = $2)`,
      [MODEL, role ?? null],
    );
    return result.rows[0]?.count ?? 0;
  }

  private async basis(role?: string) {
    const result = await this.db.pool.query<{ postings: number }>(
      `SELECT count(DISTINCT posting_id)::int AS postings
       FROM skill_runs r
       JOIN postings p ON p.id = r.posting_id
       WHERE r.model = $1 AND ($2::text IS NULL OR p.role = $2)`,
      [MODEL, role ?? null],
    );
    return { postings: result.rows[0]?.postings ?? 0 };
  }
}
