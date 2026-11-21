import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Injectable } from "@nestjs/common";
import { load } from "js-yaml";
import {
  AgenciesConfig,
  RoleConfig,
  SourceConfig,
  SynonymMapping,
  TopicConfig,
} from "./config.types";

@Injectable()
export class ConfigService {
  private readonly dir = resolveConfigDir();

  sources(): SourceConfig[] {
    return this.read<{ sources?: SourceConfig[] }>("sources.yaml").sources ?? [];
  }

  roles(): RoleConfig[] {
    return this.read<{ roles?: RoleConfig[] }>("roles.yaml").roles ?? [];
  }

  topics(): TopicConfig[] {
    return this.read<{ topics?: TopicConfig[] }>("topics.yaml").topics ?? [];
  }

  synonyms(): SynonymMapping[] {
    return this.read<{ mappings?: SynonymMapping[] }>("synonyms.yaml").mappings ?? [];
  }

  agencies(): AgenciesConfig {
    const file = this.read<Partial<AgenciesConfig>>("agencies.yaml");
    return {
      names: file.names ?? [],
      phrases: file.phrases ?? [],
    };
  }

  private read<T>(file: string): T {
    return load(readFileSync(join(this.dir, file), "utf8")) as T;
  }
}

function resolveConfigDir(): string {
  const candidates = [
    join(process.cwd(), "../config"),
    join(process.cwd(), "config"),
    join(__dirname, "../../../config"),
  ];
  const found = candidates.find((dir) => existsSync(join(dir, "sources.yaml")));
  if (!found) {
    throw new Error(`config/sources.yaml not found from ${process.cwd()}`);
  }
  return found;
}
