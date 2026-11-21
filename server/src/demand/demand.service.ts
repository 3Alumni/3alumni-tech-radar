import { Injectable } from "@nestjs/common";
import { DbService } from "../core/db.service";

interface MetricRow {
  role: string;
  label: string;
  period: string | null;
  value: string;
  unit: string | null;
  geo: string | null;
  source_id: string;
  source_url: string;
  fetched_at: Date;
  snapshot_id: string;
}

interface PostingRow {
  title: string;
  company: string | null;
  url: string;
  posted_at: Date | null;
  location_area: string[] | null;
}

export interface DemandPosting {
  title: string;
  company: string | null;
  canton: string | null;
  url: string;
  postedAt: string | null;
}

export interface SalaryPoint {
  month: string;
  salary: number;
}

export interface SalaryTrend {
  category: string;
  label: string;
  currency: "CHF";
  scope: "category";
  sourceId: string;
  sourceUrl: string;
  fetchedAt: string;
  months: SalaryPoint[];
}

export interface DemandRole {
  role: string;
  query: string;
  lang: string | null;
  openings: number;
  sampleSize: number;
  geo: string | null;
  sourceId: string;
  sourceUrl: string;
  fetchedAt: string;
  cantons: { canton: string; postings: number }[];
  unknownCanton: number;
  postings: DemandPosting[];
}

@Injectable()
export class DemandService {
  constructor(private readonly db: DbService) {}

  async list(): Promise<{ roles: DemandRole[]; salaryTrend: SalaryTrend | null }> {
    const metrics = await this.db.pool.query<MetricRow>(
      `SELECT role, label, period, value, unit, geo, source_id, source_url, fetched_at, snapshot_id
       FROM metrics
       WHERE question = 'A' AND role IS NOT NULL
       ORDER BY role, period, fetched_at DESC`,
    );

    const roles: DemandRole[] = [];
    for (const metric of metrics.rows) {
      const postings = await this.db.pool.query<PostingRow>(
        `SELECT title, company, url, posted_at, location_area
         FROM postings
         WHERE snapshot_id = $1
         ORDER BY posted_at DESC NULLS LAST, id`,
        [metric.snapshot_id],
      );
      const mapped = postings.rows.map((row) => ({
        title: row.title,
        company: row.company,
        canton: cantonFromArea(row.location_area),
        url: row.url,
        postedAt: row.posted_at ? new Date(row.posted_at).toISOString() : null,
      }));
      const counts = new Map<string, number>();
      let unknownCanton = 0;
      for (const posting of mapped) {
        if (!posting.canton) {
          unknownCanton += 1;
          continue;
        }
        counts.set(posting.canton, (counts.get(posting.canton) ?? 0) + 1);
      }
      roles.push({
        role: metric.role,
        query: metric.label,
        lang: metric.period,
        openings: Number(metric.value),
        sampleSize: mapped.length,
        geo: metric.geo,
        sourceId: metric.source_id,
        sourceUrl: metric.source_url,
        fetchedAt: new Date(metric.fetched_at).toISOString(),
        cantons: [...counts.entries()]
          .map(([canton, count]) => ({ canton, postings: count }))
          .sort((a, b) => b.postings - a.postings || a.canton.localeCompare(b.canton)),
        unknownCanton,
        postings: mapped,
      });
    }
    return { roles, salaryTrend: await this.salaryTrend() };
  }

  private async salaryTrend(): Promise<SalaryTrend | null> {
    const points = await this.db.pool.query<{ month: string; salary: number; source_url: string; fetched_at: Date }>(
      `SELECT to_char(month, 'YYYY-MM') AS month,
              salary::float8 AS salary,
              source_url,
              fetched_at
       FROM salary_points
       WHERE category = 'it-jobs'
         AND fetched_at = (SELECT max(fetched_at) FROM salary_points WHERE category = 'it-jobs')
       ORDER BY month`,
    );
    const first = points.rows[0];
    if (!first) {
      return null;
    }
    return {
      category: "it-jobs",
      label: "IT Jobs",
      currency: "CHF",
      scope: "category",
      sourceId: "adzuna",
      sourceUrl: first.source_url,
      fetchedAt: new Date(first.fetched_at).toISOString(),
      months: points.rows.map((row) => ({ month: row.month, salary: row.salary })),
    };
  }
}

function cantonFromArea(area: string[] | null): string | null {
  const canton = area?.[1];
  return canton?.startsWith("Kanton ") ? canton : null;
}
