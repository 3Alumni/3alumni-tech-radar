import { Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";
import { SourceFileBlob } from "../core/connector";
import { ConfigService } from "../core/config.service";
import { SourceFileConfig } from "../core/config.types";
import { ConnectorRegistry } from "../core/connector-registry.service";
import { Metric } from "../core/metric";
import { SourceConnector } from "../core/source-connector";

type Row = unknown[];

/**
 * SEM publishes aggregates as CSV and XLSX. There is no JSON API.
 * The raw file is kept on the connector so refresh can store it in Postgres.
 * Category names come from the data file itself.
 */
@Injectable()
export class SemConnector extends SourceConnector {
  readonly id = "sem";
  takenFiles: SourceFileBlob[] = [];

  constructor(
    registry: ConnectorRegistry,
    private readonly config: ConfigService,
  ) {
    super(registry);
  }

  async fetch(): Promise<Metric[]> {
    this.takenFiles = [];
    const fetchedAt = new Date().toISOString();
    const files = this.files();
    const metrics: Metric[] = [];
    const asylum = await this.asylum(fileById(files, "6-20"), fetchedAt);
    metrics.push(...asylum.metrics);
    metrics.push(
      ...(await this.employmentChange(
        fileById(files, "6-21"),
        fetchedAt,
        "Asylsuchende",
        "Ausweis N",
        "Status N in work, change since previous month",
        asylum.statusN,
        asylum.statusNInWork,
      )),
    );
    metrics.push(
      ...(await this.employmentChange(
        fileById(files, "6-22"),
        fetchedAt,
        "vorläufig",
        "Ausweis F",
        "Status F in work, change since previous month",
        asylum.statusF,
        asylum.statusFInWork,
      )),
    );
    metrics.push(...(await this.statusS(fileById(files, "6-24"), fetchedAt)));
    metrics.push(...(await this.residents(fileById(files, "2-24"), fetchedAt)));
    metrics.push(...(await this.refugees(fileById(files, "2-30"), fetchedAt)));
    metrics.push(...(await this.nonPermanentWork(fileById(files, "2-50"), fetchedAt)));
    metrics.push(...(await this.immigration(fileById(files, "3-42"), fetchedAt)));
    if (metrics.length === 0) {
      throw new Error("SEM refresh produced no metrics");
    }
    return metrics;
  }

  private files(): SourceFileConfig[] {
    const source = this.config.sources().find((item) => item.id === this.id);
    const files = source?.files ?? [];
    if (files.length === 0) {
      throw new Error("SEM source is missing files in config/sources.yaml");
    }
    return files;
  }

  /** Download the published file and remember the bytes for the database. */
  private async keep(file: SourceFileConfig, fetchedAt: string): Promise<Buffer> {
    const content = await download(file.url);
    this.takenFiles.push({
      sourceId: this.id,
      fileId: file.id,
      format: file.format,
      period: file.period,
      page: file.page,
      url: file.url,
      content,
      fetchedAt,
    });
    return content;
  }

  /**
   * Workbook 6-20, sheet CH-Kt, October 2026 layout:
   * B (1) people in the asylum process
   * C (2) residence status N
   * E (4) status N in work
   * H (7) residence status F
   * J (9) status F in work
   * Canton rows use the same columns. Their status F cells sum to the Total row.
   */
  private async asylum(
    file: SourceFileConfig,
    fetchedAt: string,
  ): Promise<{
    metrics: Metric[];
    statusN: number;
    statusNInWork: number;
    statusF: number;
    statusFInWork: number;
  }> {
    const rows = workbookRows(file, await this.keep(file, fetchedAt));
    requireHeader(rows, 2, "Ausweis N");
    requireHeader(rows, 4, "tätige");
    requireHeader(rows, 7, "Ausweis F");
    requireHeader(rows, 9, "tätige");
    const total = totalRow(rows);
    const process = asNumber(total[1], "6-20 asylum process");
    const statusN = asNumber(total[2], "6-20 status N");
    const statusNInWork = asNumber(total[4], "6-20 status N in work");
    const statusF = asNumber(total[7], "6-20 status F");
    const statusFInWork = asNumber(total[9], "6-20 status F in work");
    const cantons = cantonRows(rows, 7);
    const cantonSum = [...cantons.values()].reduce((sum, value) => sum + value, 0);
    if (cantonSum !== statusF) {
      throw new Error(`SEM 6-20 canton sum ${cantonSum} does not match status F ${statusF}`);
    }
    const metrics: Metric[] = [
      this.metric(file, fetchedAt, "Residence status F", statusF, "CH"),
      this.metric(file, fetchedAt, "Status F in work", statusFInWork, "CH"),
      this.metric(file, fetchedAt, "Residence status N", statusN, "CH"),
      this.metric(file, fetchedAt, "Status N in work", statusNInWork, "CH"),
      this.metric(file, fetchedAt, "People in the asylum process", process, "CH"),
    ];
    for (const [canton, value] of cantons) {
      metrics.push(this.metric(file, fetchedAt, `Residence status F, ${canton}`, value, canton));
    }
    return { metrics, statusN, statusNInWork, statusF, statusFInWork };
  }

  /**
   * Workbooks 6-21 and 6-22 repeat the stock already taken from 6-20.
   * Sheet CH-Kt: B (1) stock, D (3) people in work, G (6) change since last month.
   * The stock cells must match 6-20 or the refresh fails.
   */
  private async employmentChange(
    file: SourceFileConfig,
    fetchedAt: string,
    columnNeedle: string,
    workbookNeedle: string,
    label: string,
    expectedStock: number,
    expectedInWork: number,
  ): Promise<Metric[]> {
    const rows = workbookRows(file, await this.keep(file, fetchedAt));
    requireHeader(rows, 1, columnNeedle);
    requireText(rows, workbookNeedle);
    requireHeader(rows, 3, "Erwerbstätige");
    requireHeader(rows, 6, "absolut");
    const total = totalRow(rows);
    const stock = asNumber(total[1], `${file.id} stock`);
    const inWork = asNumber(total[3], `${file.id} in work`);
    const change = asNumber(total[6], `${file.id} change`);
    if (stock !== expectedStock || inWork !== expectedInWork) {
      throw new Error(
        `SEM ${file.id} does not match workbook 6-20 (${stock}/${inWork} vs ${expectedStock}/${expectedInWork})`,
      );
    }
    return [this.metric(file, fetchedAt, label, change, "CH")];
  }

  /**
   * Workbook 6-24, sheet CH-Kt:
   * B (1) residence status S, including one row per canton
   * D (3) status S in work
   */
  private async statusS(file: SourceFileConfig, fetchedAt: string): Promise<Metric[]> {
    const rows = workbookRows(file, await this.keep(file, fetchedAt));
    requireHeader(rows, 1, "vorübergehender Schutz");
    requireHeader(rows, 3, "Erwerbstätige");
    const total = totalRow(rows);
    const statusS = asNumber(total[1], "6-24 status S");
    const cantons = cantonRows(rows, 1);
    const cantonSum = [...cantons.values()].reduce((sum, value) => sum + value, 0);
    if (cantonSum !== statusS) {
      throw new Error(`SEM 6-24 canton sum ${cantonSum} does not match status S ${statusS}`);
    }
    const metrics = [
      this.metric(file, fetchedAt, "Residence status S", statusS, "CH"),
      this.metric(file, fetchedAt, "Status S in work", asNumber(total[3], "6-24 status S in work"), "CH"),
    ];
    for (const [canton, value] of cantons) {
      metrics.push(this.metric(file, fetchedAt, `Residence status S, ${canton}`, value, canton));
    }
    return metrics;
  }

  private async residents(file: SourceFileConfig, fetchedAt: string): Promise<Metric[]> {
    const groups = new Map<string, number>();
    const cantons = new Map<string, number>();
    const origins = new Map<string, number>();
    let total = 0;
    await eachCsvRow(await this.keep(file, fetchedAt), file.url, (row) => {
      const count = persons(row.AnzahlPersonen);
      total += count;
      add(groups, row.Auslaendergruppe, count);
      add(cantons, row.Wohnkanton, count);
      add(origins, row.EuropaDrittstaat, count);
    });
    assertTotal(file.id, total, groups, cantons, origins);
    const metrics = [this.metric(file, fetchedAt, "Foreign residents", total, "CH")];
    for (const [group, value] of groups) {
      metrics.push(this.metric(file, fetchedAt, `Foreign residents, ${group}`, value, "CH"));
    }
    for (const [origin, value] of origins) {
      metrics.push(this.metric(file, fetchedAt, originLabel(origin), value, "CH"));
    }
    for (const [canton, value] of cantons) {
      metrics.push(this.metric(file, fetchedAt, `Foreign residents, ${canton}`, value, canton));
    }
    return metrics;
  }

  private async refugees(file: SourceFileConfig, fetchedAt: string): Promise<Metric[]> {
    const groups = new Map<string, number>();
    let total = 0;
    await eachCsvRow(await this.keep(file, fetchedAt), file.url, (row) => {
      const count = persons(row.AnzahlPersonen);
      total += count;
      add(groups, row.AuslaendergruppeFlu, count);
    });
    assertTotal(file.id, total, groups);
    return [
      this.metric(file, fetchedAt, "Recognized refugees", total, "CH"),
      ...[...groups].map(([group, value]) =>
        this.metric(file, fetchedAt, `Recognized refugees, ${group}`, value, "CH"),
      ),
    ];
  }

  private async nonPermanentWork(file: SourceFileConfig, fetchedAt: string): Promise<Metric[]> {
    const groups = new Map<string, number>();
    let total = 0;
    await eachCsvRow(await this.keep(file, fetchedAt), file.url, (row) => {
      const count = persons(row.AnzahlPersonen);
      total += count;
      add(groups, row.Auslaendergruppe, count);
    });
    assertTotal(file.id, total, groups);
    return [
      this.metric(file, fetchedAt, "Non-permanent residents in work", total, "CH"),
      ...[...groups].map(([group, value]) =>
        this.metric(file, fetchedAt, `Non-permanent residents in work, ${group}`, value, "CH"),
      ),
    ];
  }

  private async immigration(file: SourceFileConfig, fetchedAt: string): Promise<Metric[]> {
    const groups = new Map<string, number>();
    let total = 0;
    await eachCsvRow(await this.keep(file, fetchedAt), file.url, (row) => {
      const count = persons(row.AnzahlPersonen);
      total += count;
      add(groups, row.StaeNichtStaeBev, count);
    });
    assertTotal(file.id, total, groups);
    return [
      this.metric(file, fetchedAt, "Immigration with work", total, "CH"),
      ...[...groups].map(([group, value]) =>
        this.metric(file, fetchedAt, `Immigration with work, ${group}`, value, "CH"),
      ),
    ];
  }

  private metric(
    file: SourceFileConfig,
    fetchedAt: string,
    label: string,
    value: number,
    geo: string,
  ): Metric {
    return {
      label,
      value,
      question: "D",
      geo,
      period: file.period,
      sourceId: this.id,
      sourceUrl: file.page,
      fetchedAt,
    };
  }
}

function fileById(files: SourceFileConfig[], id: string): SourceFileConfig {
  const file = files.find((item) => item.id === id);
  if (!file) {
    throw new Error(`SEM file ${id} is missing from config/sources.yaml`);
  }
  return file;
}

function originLabel(value: string): string {
  if (value === "EU") {
    return "Foreign residents from the EU";
  }
  if (value === "EFTA") {
    return "Foreign residents from EFTA";
  }
  if (value === "Drittstaaten") {
    return "Foreign residents from third countries";
  }
  throw new Error(`Unknown SEM origin category ${value}`);
}

function add(groups: Map<string, number>, key: string | undefined, amount: number) {
  const name = key?.trim();
  if (!name) {
    throw new Error("SEM row is missing a category");
  }
  groups.set(name, (groups.get(name) ?? 0) + amount);
}

function assertTotal(fileId: string, total: number, ...groups: Map<string, number>[]) {
  if (total <= 0) {
    throw new Error(`SEM ${fileId} total is empty`);
  }
  for (const group of groups) {
    const sum = [...group.values()].reduce((left, right) => left + right, 0);
    if (sum !== total) {
      throw new Error(`SEM ${fileId} groups sum to ${sum}, total is ${total}`);
    }
  }
}

function persons(value: string | undefined): number {
  if (value == null || !/^-?\d+$/.test(value.trim())) {
    throw new Error(`SEM count is not an integer: ${value ?? ""}`);
  }
  return Number(value);
}

async function download(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "powercoders-radar" },
      signal: AbortSignal.timeout(180_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    const reason = error instanceof Error ? error.message : "download failed";
    throw new Error(`SEM download failed for ${url}: ${reason}`);
  }
}

function eachCsvRow(
  content: Buffer,
  url: string,
  visit: (row: Record<string, string>) => void,
): void {
  const lines = content.toString("utf8").split(/\r?\n/);
  let header: string[] | null = null;
  let count = 0;
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const cells = splitSemicolon(line);
    if (!header) {
      header = cells.map((cell) => cell.replace(/^\uFEFF/, ""));
      continue;
    }
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = cells[index] ?? "";
    });
    visit(row);
    count += 1;
  }
  if (count === 0) {
    throw new Error(`SEM CSV has no data rows: ${url}`);
  }
}

function splitSemicolon(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === ";" && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function workbookRows(file: SourceFileConfig, content: Buffer): Row[] {
  const book = XLSX.read(content, { type: "buffer" });
  const sheet = book.Sheets["CH-Kt"];
  if (!sheet) {
    throw new Error(`SEM workbook ${file.id} is missing sheet CH-Kt`);
  }
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as Row[];
}

function text(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function requireHeader(rows: Row[], column: number, needle: string) {
  const found = rows.some((row) => text(row[column]).toLowerCase().includes(needle.toLowerCase()));
  if (!found) {
    throw new Error(`SEM workbook column ${column} does not contain "${needle}"`);
  }
}

function requireText(rows: Row[], needle: string) {
  const found = rows.some((row) => row.some((cell) => text(cell).toLowerCase().includes(needle.toLowerCase())));
  if (!found) {
    throw new Error(`SEM workbook does not contain "${needle}"`);
  }
}

function totalRow(rows: Row[]): Row {
  const row = rows.find((candidate) => text(candidate[0]) === "Total");
  if (!row) {
    throw new Error("SEM workbook has no Total row");
  }
  return row;
}

function cantonRows(rows: Row[], column: number): Map<string, number> {
  const cantons = new Map<string, number>();
  for (const row of rows) {
    const name = text(row[0]);
    if (!name || name === "Total" || name.startsWith("Quelle")) {
      continue;
    }
    if (typeof row[column] !== "number") {
      continue;
    }
    cantons.set(name, asNumber(row[column], name));
  }
  if (cantons.size === 0) {
    throw new Error("SEM workbook has no canton rows");
  }
  return cantons;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  throw new Error(`SEM cell ${label} is not a number`);
}
