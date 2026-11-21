import { Injectable } from "@nestjs/common";
import { SourceFileBlob } from "../core/connector";
import { ConfigService } from "../core/config.service";
import { ConnectorRegistry } from "../core/connector-registry.service";
import { Metric } from "../core/metric";
import { SourceConnector } from "../core/source-connector";

const QUERY = `
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?act ?title ?date
  (SAMPLE(?ref) AS ?reference)
  (SAMPLE(?inForce) AS ?enters)
  (SAMPLE(?genre) AS ?kind)
  (SAMPLE(?office) AS ?authority)
  (SAMPLE(?file) AS ?text)
WHERE {
  ?act a jolux:Act ;
       jolux:publicationDate ?date ;
       jolux:isRealizedBy ?expr .
  ?expr jolux:language <http://publications.europa.eu/resource/authority/language/DEU> ;
        jolux:title ?title .
  FILTER(?date >= "2024-01-01"^^xsd:date)
  # Question E only: asylum, status F, temporary protection, foreigner integration, job-registration duty.
  # "integration" alone also matches disability-insurance reform, so it is not used by itself.
  FILTER(
    CONTAINS(LCASE(STR(?title)), "asyl") ||
    CONTAINS(LCASE(STR(?title)), "stellenmeldepflicht") ||
    CONTAINS(LCASE(STR(?title)), "flüchtling") ||
    CONTAINS(LCASE(STR(?title)), "vorläufig aufgen") ||
    CONTAINS(LCASE(STR(?title)), "vorübergehenden schutz") ||
    CONTAINS(LCASE(STR(?title)), "vorübergehender schutz") ||
    (
      CONTAINS(LCASE(STR(?title)), "ausländer") &&
      (
        CONTAINS(LCASE(STR(?title)), "integration") ||
        CONTAINS(LCASE(STR(?title)), "erwerb") ||
        CONTAINS(LCASE(STR(?title)), "schutz") ||
        CONTAINS(LCASE(STR(?title)), "asyl")
      )
    )
  )
  FILTER(!CONTAINS(LCASE(STR(?title)), "invalidenversicherung"))
  FILTER(!CONTAINS(LCASE(STR(?title)), "luftverkehr"))
  FILTER(!CONTAINS(LCASE(STR(?title)), "reiseinformationssystem"))
  OPTIONAL { ?act jolux:dateEntryInForce ?inForce }
  OPTIONAL {
    ?act jolux:legalResourceGenre ?genreUri .
    ?genreUri skos:prefLabel ?genre .
    FILTER(LANG(?genre) = "de")
  }
  OPTIONAL {
    ?act jolux:responsibilityOf ?officeUri .
    ?officeUri skos:prefLabel ?office .
    FILTER(LANG(?office) = "de")
  }
  OPTIONAL { ?expr <http://purl.org/dc/terms/identifier> ?ref }
  OPTIONAL {
    ?expr jolux:isEmbodiedBy ?manifest .
    FILTER(STRENDS(STR(?manifest), "/html"))
    ?manifest jolux:isExemplifiedBy ?file .
    FILTER(!CONTAINS(STR(?file), "intranet"))
  }
}
GROUP BY ?act ?title ?date
ORDER BY DESC(?date)
LIMIT 20
`;

interface Binding {
  act?: { value?: string };
  title?: { value?: string };
  date?: { value?: string };
  reference?: { value?: string };
  enters?: { value?: string };
  kind?: { value?: string };
  authority?: { value?: string };
  text?: { value?: string };
}

/**
 * Titles that can force a change in the programme are listed first.
 * The rest stay in publication order.
 */
const IMPORTANT = [/vorläufig/i, /vorübergehend/i, /stellenmeldepflicht/i, /asyl/i, /integration/i, /ausländer/i];

@Injectable()
export class FedlexConnector extends SourceConnector {
  readonly id = "fedlex";
  takenFiles: SourceFileBlob[] = [];

  constructor(
    registry: ConnectorRegistry,
    private readonly config: ConfigService,
  ) {
    super(registry);
  }

  async fetch(): Promise<Metric[]> {
    this.takenFiles = [];
    const source = this.config.sources().find((item) => item.id === this.id);
    if (!source?.url) {
      throw new Error("Fedlex source is missing a SPARQL url");
    }
    const response = await fetch(source.url, {
      method: "POST",
      headers: {
        Accept: "application/sparql-results+json",
        "Content-Type": "application/sparql-query",
        "User-Agent": "powercoders-radar",
      },
      body: QUERY,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      throw new Error(`Fedlex query failed (${response.status})`);
    }
    const payload = (await response.json()) as { results?: { bindings?: Binding[] } };
    const bindings = payload.results?.bindings;
    if (!bindings) {
      throw new Error("Fedlex response has no bindings");
    }
    const fetchedAt = new Date().toISOString();
    const seen = new Set<string>();
    const metrics: Metric[] = [];
    for (const binding of bindings) {
      const uri = binding.act?.value;
      const title = binding.title?.value?.trim();
      const date = binding.date?.value;
      if (!uri || !title || !date) {
        throw new Error("Fedlex row is missing a title, date, or URI");
      }
      if (seen.has(uri)) {
        continue;
      }
      seen.add(uri);
      const textUrl = binding.text?.value;
      const downloaded = textUrl ? await actText(textUrl) : undefined;
      if (textUrl && downloaded) {
        this.takenFiles.push({
          sourceId: this.id,
          fileId: present(binding.reference?.value) ?? uri,
          format: "html",
          period: date,
          page: fedlexPage(uri),
          url: textUrl,
          content: downloaded.raw,
          fetchedAt,
        });
      }
      metrics.push({
        label: title,
        value: date,
        question: "E",
        period: date,
        sourceId: this.id,
        sourceUrl: fedlexPage(uri),
        fetchedAt,
        reference: present(binding.reference?.value),
        kind: present(binding.kind?.value),
        authority: present(binding.authority?.value),
        inForce: present(binding.enters?.value),
        textUrl,
        text: downloaded?.text,
      });
    }
    if (metrics.length === 0) {
      throw new Error("Fedlex query returned no acts");
    }
    return metrics.sort((left, right) => Number(isImportant(right.label)) - Number(isImportant(left.label)));
  }
}

function isImportant(label: string): boolean {
  return IMPORTANT.some((pattern) => pattern.test(label));
}

function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Plain text plus the original HTML. A missing file does not fail the refresh. */
async function actText(url: string): Promise<{ text: string; raw: Buffer } | undefined> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "powercoders-radar" },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      return undefined;
    }
    const raw = Buffer.from(await response.arrayBuffer());
    const text = plainText(raw.toString("utf8"));
    return text ? { text, raw } : undefined;
  } catch {
    return undefined;
  }
}

function plainText(html: string): string {
  const withBreaks = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(h1|h2|h3|h4|p|li|tr|div|section)>/gi, "\n")
    .replace(/<\/(td|th)>/gi, "\t")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(withBreaks)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

function fedlexPage(uri: string): string {
  const marker = "fedlex.data.admin.ch";
  const index = uri.indexOf(marker);
  if (index === -1) {
    throw new Error(`Unexpected Fedlex URI ${uri}`);
  }
  return `https://www.fedlex.admin.ch${uri.slice(index + marker.length)}`;
}
