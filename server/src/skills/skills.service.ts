import { Injectable } from "@nestjs/common";
import { RegistryService } from "../registry/registry.service";

@Injectable()
export class SkillsService {
  constructor(private readonly registry: RegistryService) {}

  /** Chart labels come only from synonyms.yaml. A model may suggest a line, not write one. */
  match(phrase: string): { label: string; esco?: string } | null {
    const mapping = this.registry
      .synonyms()
      .find((item) => item.phrase.toLowerCase() === phrase.toLowerCase());
    if (!mapping) {
      return null;
    }
    return { label: mapping.label, esco: mapping.esco };
  }
}
