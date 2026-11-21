import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { Question } from "../metrics/metric";
import { StoreService } from "./store.service";

const QUESTIONS = new Set<Question>(["A", "B", "C", "D", "E"]);

@Controller("metrics")
export class MetricsController {
  constructor(private readonly store: StoreService) {}

  @Get()
  list(@Query("question") question?: string) {
    if (question && !QUESTIONS.has(question as Question)) {
      throw new BadRequestException("question must be A, B, C, D, or E");
    }
    return this.store.latest(question as Question | undefined);
  }
}
