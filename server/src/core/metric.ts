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
  /** Official number, such as AS 2026 649 or BBl 2026 2961. */
  reference?: string;
  /** Kind of act, in the source language. */
  kind?: string;
  /** Office responsible for the act. */
  authority?: string;
  /** Date the act enters into force, when Fedlex publishes one. */
  inForce?: string;
  /** File that contains the act text. */
  textUrl?: string;
  /** Full plain text of the act. The original file stays at textUrl. */
  text?: string;
}
