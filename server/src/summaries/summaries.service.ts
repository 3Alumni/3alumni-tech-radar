import { createHash } from "crypto";
import { Injectable } from "@nestjs/common";
import { completeJson } from "../ai/openai.client";
import { DbService } from "../core/db.service";
import { Metric } from "../core/metric";

const SOURCE_TITLES: Record<string, string> = {
  sem: "State Secretariat for Migration",
  fedlex: "Fedlex",
};

/** Rows that can change the programme are sent first. */
const IMPORTANT = [/status f/i, /vorläufig/i, /vorübergehend/i, /stellenmeldepflicht/i, /asyl/i, /integration/i, /ausländer/i];

const SYSTEM = `Reply in English only. The records may be in German. Translate them. Do not leave German sentences in text, keyChanges, or keyUpdates.
You write a short briefing for non-technical staff at Powercoders.
Powercoders trains refugees and migrants for IT jobs in Switzerland.
Use only the facts in the JSON. Do not invent numbers, dates, percentages, or laws.
If a figure is not in the JSON, leave it out.
Write 2 to 4 short paragraphs in English.
Lead with what could change the programme: status F, asylum, integration, the right to work, and employer job-registration duties.
Do not list every canton or every act. Mention the national totals and only the changes that matter.
Every paragraph that states a figure or a law must include the source name and the sourceUrl from that record.
Also return two arrays of short strings. Do not start any item with "This".
keyChanges: a rule or figure that could force Powercoders to change the programme. Include the sourceUrl.
keyUpdates: a newly published number or act in the records that does not by itself force a programme change. Include the sourceUrl.
Use [] when there are none. Do not invent items.
Return JSON: {"text":"...","keyChanges":[],"keyUpdates":[]}`;

const MARKET = `Reply in English only.
You write one short letter section for non-technical staff at Powercoders.
Powercoders trains refugees and migrants for IT jobs in Switzerland.
Use only the facts in the JSON. Do not invent numbers, companies, or skills.
Write 2 or 3 short paragraphs about the job ads, skills, or companies in the records.
Name the largest figures first. Do not list every row.
Do not mention asylum, residence status, status F, integration law, or job-registration duties.
Do not say that those topics are absent.
Every paragraph that states a figure must include the source name and the sourceUrl from that record.
Also return two arrays of short strings. Do not start any item with "This".
keyChanges: a skill or employer fact that should change what the team teaches or who they contact. Include the sourceUrl. Use [] when there are none.
keyUpdates: other figures from the records worth knowing. Include the sourceUrl. Use [] when there are none.
Return JSON: {"text":"...","keyChanges":[],"keyUpdates":[]}`;

export interface Briefing {
  text: string;
  keyChanges: string[];
  keyUpdates: string[];
}

interface DraftResponse {
  text?: string;
  titleEn?: string;
  keyChanges?: unknown;
  keyUpdates?: unknown;
}

export interface ActBriefing extends Briefing {
  /** English reading title. The stored German title stays on the metric. */
  titleEn: string;
}

@Injectable()
export class SummariesService {
  /** One OpenAI call per cache key, even if the page asks for the same act twice at once. */
  private readonly inflight = new Map<string, Promise<Briefing & { titleEn?: string }>>();

  constructor(private readonly db: DbService) {}

  /**
   * Phrases records that are already stored. The model may not compute new numbers.
   * The same topic and the same records are read back from Postgres.
   */
  async draft(records: Metric[], topicTitle?: string, focus: "policy" | "market" = "policy"): Promise<Briefing> {
    if (records.length === 0) {
      return { text: "No fresh records.", keyChanges: [], keyUpdates: [] };
    }
    const ordered = [...records].sort(
      (left, right) => Number(isImportant(right.label)) - Number(isImportant(left.label)),
    );
    const payload = {
      topic: topicTitle ?? null,
      records: ordered.map(pack),
    };
    const stored = await this.remember(cacheKey(focus, payload), () =>
      this.writeTopic(payload, focus === "market" ? MARKET : SYSTEM),
    );
    return { text: stored.text, keyChanges: stored.keyChanges, keyUpdates: stored.keyUpdates };
  }

  /** A readable account of one act. Only the supplied text may be used. */
  async draftAct(act: { title: string; text: string; sourceUrl?: string; reference?: string }): Promise<ActBriefing> {
    const text = act.text.slice(0, 12000);
    const stored = await this.remember(
      cacheKey("act", {
        title: act.title,
        reference: act.reference ?? null,
        sourceUrl: act.sourceUrl ?? null,
        text,
      }),
      () => this.writeAct({ ...act, text }),
    );
    return {
      text: stored.text,
      keyChanges: stored.keyChanges,
      keyUpdates: stored.keyUpdates,
      titleEn: stored.titleEn || act.title,
    };
  }

  private async writeTopic(
    payload: { topic: string | null; records: ReturnType<typeof pack>[] },
    system: string,
  ) {
    const result = await completeJson<DraftResponse>({
      system,
      user: JSON.stringify(payload),
    });
    return briefing(result, "OpenAI summary was empty");
  }

  private async writeAct(act: { title: string; text: string; sourceUrl?: string; reference?: string }): Promise<ActBriefing> {
    const result = await completeJson<DraftResponse>({
      system: `Reply in English only. The act is in German. Translate it. Do not leave German sentences in the paragraph, keyChanges, or keyUpdates. Official short names such as Asylverordnung 1 or AIG may stay, with the English meaning beside them.
You explain one Swiss legal act to a non-technical Powercoders colleague.
Powercoders trains refugees and migrants for IT jobs.
Use only the supplied act text. Do not add facts, dates, or numbers that are not in it.
Write one short paragraph in English: what it changes, who it affects, and when it applies if the text says so.
Start with the act's own short name from the title, then the verb. Example shape: "Asylverordnung 1 replaces Annex 3 from 1 January 2027."
Never start with "This", "The act", "The law", or "It".
Mention status F, asylum, temporary protection, integration, or work only when the text does.
End with the sourceUrl.
Also return titleEn: a short English title a colleague can read. Keep the official short name and put the English meaning in parentheses. Example: "Asylverordnung 1 (Asylum Ordinance 1)". Do not copy the full German title.
Also return keyChanges and keyUpdates for this act only.
keyChanges: what in this text could force the programme to change. keyUpdates: what the act newly publishes that does not force a change.
Short strings, never starting with "This". Include the sourceUrl. Use [] when there are none.
Return JSON: {"titleEn":"...","text":"...","keyChanges":[],"keyUpdates":[]}`,
      user: JSON.stringify({
        title: act.title,
        reference: act.reference ?? null,
        sourceUrl: act.sourceUrl ?? null,
        text: act.text.slice(0, 12000),
      }),
    });
    return {
      ...briefing(result, "OpenAI act summary was empty"),
      titleEn: result.titleEn?.trim() || act.title,
    };
  }

  private async remember(
    key: string,
    produce: () => Promise<Briefing & { titleEn?: string }>,
  ): Promise<Briefing & { titleEn?: string }> {
    const stored = await this.read(key);
    if (stored) return stored;
    const running = this.inflight.get(key);
    if (running) return running;
    const job = produce().then(async (fresh) => {
      await this.save(key, fresh);
      return fresh;
    });
    this.inflight.set(key, job);
    try {
      return await job;
    } finally {
      this.inflight.delete(key);
    }
  }

  private async read(key: string): Promise<(Briefing & { titleEn?: string }) | null> {
    const result = await this.db.pool.query<{
      title_en: string | null;
      body: string;
      key_changes: string[];
      key_updates: string[];
    }>(
      `SELECT title_en, body, key_changes, key_updates
       FROM summaries
       WHERE cache_key = $1`,
      [key],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      text: row.body,
      keyChanges: row.key_changes ?? [],
      keyUpdates: row.key_updates ?? [],
      titleEn: row.title_en ?? undefined,
    };
  }

  private async save(key: string, summary: Briefing & { titleEn?: string }) {
    await this.db.pool.query(
      `INSERT INTO summaries (cache_key, title_en, body, key_changes, key_updates)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       ON CONFLICT (cache_key) DO NOTHING`,
      [
        key,
        summary.titleEn ?? null,
        summary.text,
        JSON.stringify(summary.keyChanges),
        JSON.stringify(summary.keyUpdates),
      ],
    );
  }
}

function cacheKey(kind: string, payload: unknown): string {
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return `${kind}:${hash}`;
}

function briefing(result: DraftResponse, emptyError: string): Briefing {
  const text = result.text?.trim();
  if (!text) {
    throw new Error(emptyError);
  }
  return {
    text,
    keyChanges: lines(result.keyChanges),
    keyUpdates: lines(result.keyUpdates),
  };
}

function lines(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function pack(record: Metric) {
  return {
    label: record.label,
    value: record.value,
    unit: record.unit,
    geo: record.geo,
    period: record.period,
    reference: record.reference,
    kind: record.kind,
    authority: record.authority,
    inForce: record.inForce,
    source: SOURCE_TITLES[record.sourceId] ?? record.sourceId,
    sourceUrl: record.sourceUrl,
    fetchedAt: record.fetchedAt,
    excerpt: record.text ? record.text.slice(0, 500) : undefined,
  };
}

function isImportant(label: string): boolean {
  return IMPORTANT.some((pattern) => pattern.test(label));
}
