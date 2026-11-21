export type Question = "A" | "B" | "C" | "D" | "E";

/** Shape every connector returns and every tab renders. */
export interface Metric {
  label: string;
  value: number | string;
  unit?: string;
  question: Question;
  role?: string;
  geo?: string;
  period?: string;
  sourceId: string;
  sourceUrl: string;
  fetchedAt: string;
}
