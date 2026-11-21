import { Injectable } from "@nestjs/common";
import { RegistryService } from "../registry/registry.service";

export interface AgencyDecision {
  agency: boolean;
  reason: string | null;
}

@Injectable()
export class EmployersService {
  constructor(private readonly registry: RegistryService) {}

  classify(company: string, text = ""): AgencyDecision {
    const agencies = this.registry.agencies();
    const name = agencies.names.find((item) =>
      company.toLowerCase().includes(item.toLowerCase()),
    );
    if (name) {
      return { agency: true, reason: name };
    }
    const phrase = agencies.phrases.find((item) =>
      text.toLowerCase().includes(item.toLowerCase()),
    );
    if (phrase) {
      return { agency: true, reason: phrase };
    }
    return { agency: false, reason: null };
  }
}
