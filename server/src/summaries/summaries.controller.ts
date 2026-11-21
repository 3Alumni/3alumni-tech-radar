import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { SummariesService } from "./summaries.service";

interface ActSummaryBody {
  title?: string;
  text?: string;
  sourceUrl?: string;
  reference?: string;
}

@Controller("summaries")
export class SummariesController {
  constructor(private readonly summaries: SummariesService) {}

  @Post("act")
  async act(@Body() body: ActSummaryBody) {
    const title = body.title?.trim();
    const text = body.text?.trim();
    if (!title || !text) {
      throw new BadRequestException("Act title and text are required");
    }
    return this.summaries.draftAct({
      title,
      text,
      sourceUrl: body.sourceUrl,
      reference: body.reference,
    });
  }
}
