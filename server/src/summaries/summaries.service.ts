import { Injectable } from "@nestjs/common";
import { Metric } from "../core/metric";

@Injectable()
export class SummariesService {
  /**
   * The hosted model plugs in here. It may phrase these records only.
   * Numbers stay in the metric values the caller already stored.
   */
  draft(records: Metric[]): string {
    return records
      .map((record) => `${record.label}: ${record.value} (${record.sourceId}, ${record.fetchedAt})`)
      .join("\n");
  }
}
