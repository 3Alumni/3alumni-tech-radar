import { Injectable } from "@nestjs/common";
import { ConfigService } from "../core/config.service";
import { DbService } from "../core/db.service";

export interface AgencyDecision {
  agency: boolean;
  reason: string | null;
}

interface PostingRow {
  company: string | null;
  role: string;
  title: string;
  snippet: string | null;
  url: string;
}

export interface EmployerGroup {
  company: string;
  postings: number;
  roles: Record<string, number>;
  reason: string | null;
  urls: string[];
}

@Injectable()
export class EmployersService {
  constructor(
    private readonly db: DbService,
    private readonly config: ConfigService,
  ) {}

  classify(company: string, text = ""): AgencyDecision {
    const agencies = this.config.agencies();
    const name = agencies.names.find((item) =>
      company.toLowerCase().includes(item.toLowerCase()),
    );
    if (name) {
      return { agency: true, reason: name };
    }
    const phrase = agencies.phrases.find((item) => text.toLowerCase().includes(item.toLowerCase()));
    if (phrase) {
      return { agency: true, reason: phrase };
    }
    return { agency: false, reason: null };
  }

  async list(role?: string) {
    const postings = await this.db.pool.query<PostingRow>(
      `SELECT company, role, title, snippet, url
       FROM postings
       WHERE ($1::text IS NULL OR role = $1)`,
      [role ?? null],
    );
    const outreach = new Map<string, EmployerGroup>();
    const agencies = new Map<string, EmployerGroup>();
    for (const posting of postings.rows) {
      const company = posting.company?.trim();
      if (!company) {
        continue;
      }
      const decision = this.classify(company, `${posting.title}\n${posting.snippet ?? ""}`);
      const target = decision.agency ? agencies : outreach;
      const key = company.toLowerCase();
      const bucket = target.get(key) ?? {
        company,
        postings: 0,
        roles: {},
        reason: decision.reason,
        urls: [],
      };
      bucket.postings += 1;
      bucket.roles[posting.role] = (bucket.roles[posting.role] ?? 0) + 1;
      if (bucket.urls.length < 3) {
        bucket.urls.push(posting.url);
      }
      target.set(key, bucket);
    }
    return {
      basis: {
        postings: postings.rows.length,
        sourceId: "adzuna",
        sourceUrl: "https://www.adzuna.ch/",
        rules: "config/agencies.yaml",
      },
      outreach: [...outreach.values()].sort(byPostings),
      agencies: [...agencies.values()].sort(byPostings),
    };
  }
}

function byPostings(a: EmployerGroup, b: EmployerGroup): number {
  return b.postings - a.postings || a.company.localeCompare(b.company);
}
