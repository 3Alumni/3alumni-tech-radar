import { Metric } from "./metric";

/** A source adapter. It lives in the block it feeds and registers itself on startup. */
export interface Connector {
  id: string;
  fetch(): Promise<Metric[]>;
}
