import { Injectable } from "@nestjs/common";
import { ConfigService } from "../core/config.service";

@Injectable()
export class SkillsService {
  constructor(private readonly config: ConfigService) {}

  /** Chart labels come only from synonyms.yaml. A model may suggest a line, not write one. */
  match(phrase: string): { label: string; esco?: string } | null {
    const mapping = this.config
      .synonyms()
      .find((item) => item.phrase.toLowerCase() === phrase.toLowerCase());
    if (!mapping) {
      return null;
    }
    return { label: mapping.label, esco: mapping.esco };
  }
}
