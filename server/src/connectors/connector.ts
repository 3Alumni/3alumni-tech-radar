import { Metric } from "../metrics/metric";

/** One folder under connectors/ implements this. Register it in config/sources.yaml. */
export interface Connector {
  id: string;
  fetch(): Promise<Metric[]>;
}
