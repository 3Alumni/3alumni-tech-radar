import { Injectable } from "@nestjs/common";
import { Metric } from "../core/metric";

const SOURCE_TITLES: Record<string, string> = {
  sem: "State Secretariat for Migration",
  fedlex: "Fedlex",
};

/** Rows that can change the programme are phrased first. */
const IMPORTANT = [/status f/i, /vorläufig/i, /vorübergehend/i, /stellenmeldepflicht/i, /asyl/i, /integration/i, /ausländer/i];

@Injectable()
export class SummariesService {
  /**
   * Phrases records that are already stored. The value is copied, never recomputed.
   */
  draft(records: Metric[]): string {
    if (records.length === 0) {
      return "No fresh records.";
    }
    const ordered = [...records].sort(
      (left, right) => Number(isImportant(right.label)) - Number(isImportant(left.label)),
    );
    return ordered
      .map((record) => {
        const source = SOURCE_TITLES[record.sourceId] ?? record.sourceId;
        const unit = record.unit ? ` ${record.unit}` : "";
        const facts = [record.reference, record.kind, record.authority, record.inForce && `in force ${record.inForce}`]
          .filter((item): item is string => Boolean(item))
          .join(", ");
        const file = record.textUrl ? ` Text: ${record.textUrl}` : "";
        return `${record.label}: ${record.value}${unit}${facts ? ` (${facts}).` : "."} Source: ${source}, ${record.fetchedAt}. ${record.sourceUrl}${file}`;
      })
      .join("\n");
  }
}

function isImportant(label: string): boolean {
  return IMPORTANT.some((pattern) => pattern.test(label));
}
