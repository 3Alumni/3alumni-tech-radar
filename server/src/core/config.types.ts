import { Question } from "./metric";

export interface SourceConfig {
  id: string;
  title: string;
  questions: Question[];
  type: string;
  url: string;
  enabled: boolean;
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
