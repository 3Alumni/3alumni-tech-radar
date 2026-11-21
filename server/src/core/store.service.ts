import { Injectable } from "@nestjs/common";
import { Metric, Question } from "./metric";

@Injectable()
export class StoreService {
  private metrics: Metric[] = [];

  replace(metrics: Metric[]) {
    this.metrics = metrics;
  }

  latest(question: Question): Metric[] {
    return this.metrics.filter((metric) => metric.question === question);
  }
}
