import { Injectable } from "@nestjs/common";
import { completeJson } from "../ai/openai.client";
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

export interface Briefing {
  text: string;
  keyChanges: string[];
  keyUpdates: string[];
}

interface DraftResponse {
  text?: string;
  keyChanges?: unknown;
  keyUpdates?: unknown;
}

@Injectable()
export class SummariesService {
  /**
   * Phrases records that are already stored. The model may not compute new numbers.
   */
  async draft(records: Metric[], topicTitle?: string): Promise<Briefing> {
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
    const result = await completeJson<DraftResponse>({
      system: SYSTEM,
      user: JSON.stringify(payload),
    });
    return briefing(result, "OpenAI summary was empty");
  }

  /** A readable account of one act. Only the supplied text may be used. */
  async draftAct(act: { title: string; text: string; sourceUrl?: string; reference?: string }): Promise<Briefing> {
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
Also return keyChanges and keyUpdates for this act only.
keyChanges: what in this text could force the programme to change. keyUpdates: what the act newly publishes that does not force a change.
Short strings, never starting with "This". Include the sourceUrl. Use [] when there are none.
Return JSON: {"text":"...","keyChanges":[],"keyUpdates":[]}`,
      user: JSON.stringify({
        title: act.title,
        reference: act.reference ?? null,
        sourceUrl: act.sourceUrl ?? null,
        text: act.text.slice(0, 12000),
      }),
    });
    return briefing(result, "OpenAI act summary was empty");
  }
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
