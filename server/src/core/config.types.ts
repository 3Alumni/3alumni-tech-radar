import { Question } from "./metric";

/** A published file the connector downloads on refresh. Nothing is written to disk. */
export interface SourceFileConfig {
  id: string;
  format: "csv" | "xlsx";
  period: string;
  page: string;
  url: string;
}

export interface SourceConfig {
  id: string;
  title: string;
  questions: Question[];
  type: string;
  url: string;
  enabled: boolean;
  files?: SourceFileConfig[];
}

export interface RoleQuery {
  lang: string;
  what: string;
}

export interface RoleConfig {
  id: string;
  title: string;
  queries: RoleQuery[];
}

export interface TopicConfig {
  id: string;
  title: string;
  question: Question;
  role?: string;
}

export interface SynonymMapping {
  phrase: string;
  label: string;
  esco?: string;
}

export interface AgenciesConfig {
  names: string[];
  phrases: string[];
}
