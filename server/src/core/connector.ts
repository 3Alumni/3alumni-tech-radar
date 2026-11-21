import { Metric } from "./metric";

/** Bytes downloaded for one source file. Saved next to that source's snapshot. */
export interface SourceFileBlob {
  sourceId: string;
  fileId: string;
  format: string;
  period: string;
  page: string;
  url: string;
  content: Buffer;
  fetchedAt: string;
}

/** A source adapter. It lives in the block it feeds and registers itself on startup. */
export interface Connector {
  id: string;
  fetch(): Promise<Metric[]>;
  takenFiles?: SourceFileBlob[];
}
