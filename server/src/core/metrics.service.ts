import { Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import { SourceFileBlob } from "./connector";
import { DbService } from "./db.service";
import { Metric, Question } from "./metric";
import { readableLabel } from "../people/group-label";

interface MetricDbRow {
  label: string;
  value: string;
  unit: string | null;
  question: Question;
  role: string | null;
  geo: string | null;
  period: string | null;
  source_id: string;
  source_url: string;
  fetched_at: Date;
  reference: string | null;
  kind: string | null;
  authority: string | null;
  in_force: string | Date | null;
  text_url: string | null;
  body: string | null;
}

const LATEST_SNAPSHOTS = `
  SELECT DISTINCT ON (source_id) id
  FROM snapshots
  ORDER BY source_id, fetched_at DESC, id DESC
`;

@Injectable()
export class MetricsService {
  constructor(private readonly db: DbService) {}

  /** One snapshot per source. Rolls back the whole batch if any insert fails. */
  async save(metrics: Metric[], files: SourceFileBlob[] = []): Promise<void> {
    const groups = new Map<string, Metric[]>();
    for (const metric of metrics) {
      const rows = groups.get(metric.sourceId) ?? [];
      rows.push(metric);
      groups.set(metric.sourceId, rows);
    }
    const client = await this.db.pool.connect();
    try {
      await client.query("BEGIN");
      for (const [sourceId, rows] of groups) {
        const fetchedAt = rows.reduce(
          (latest, row) => (row.fetchedAt > latest ? row.fetchedAt : latest),
          rows[0].fetchedAt,
        );
        const snapshot = await client.query<{ id: string }>(
          `INSERT INTO snapshots (source_id, fetched_at)
           VALUES ($1, $2)
           RETURNING id`,
          [sourceId, fetchedAt],
        );
        const snapshotId = snapshot.rows[0].id;
        for (const row of rows) {
          await insertMetric(client, snapshotId, row);
        }
        for (const file of files.filter((item) => item.sourceId === sourceId)) {
          await insertFile(client, snapshotId, file);
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async latest(question: Question): Promise<Metric[]> {
    const result = await this.db.pool.query<MetricDbRow>(
      `SELECT label, value, unit, question, role, geo, period,
              source_id, source_url, fetched_at,
              reference, kind, authority, in_force, text_url, body
       FROM metrics
       WHERE question = $1
         AND snapshot_id IN (${LATEST_SNAPSHOTS})
       ORDER BY id`,
      [question],
    );
    return result.rows.map(toMetric);
  }

  async latestForSource(sourceId: string): Promise<{ metricCount: number; fetchedAt: string | null }> {
    const result = await this.db.pool.query<{ count: string; fetched_at: Date | null }>(
      `SELECT count(*)::text AS count, max(fetched_at) AS fetched_at
       FROM metrics
       WHERE snapshot_id = (
         SELECT id
         FROM snapshots
         WHERE source_id = $1
         ORDER BY fetched_at DESC, id DESC
         LIMIT 1
       )`,
      [sourceId],
    );
    const row = result.rows[0];
    return {
      metricCount: Number(row?.count ?? 0),
      fetchedAt: row?.fetched_at ? new Date(row.fetched_at).toISOString() : null,
    };
  }
}

async function insertFile(client: PoolClient, snapshotId: string, file: SourceFileBlob) {
  await client.query(
    `INSERT INTO source_files (
       snapshot_id, source_id, file_id, format, period, page, source_url, content, fetched_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      snapshotId,
      file.sourceId,
      file.fileId,
      file.format,
      file.period,
      file.page,
      file.url,
      file.content,
      file.fetchedAt,
    ],
  );
}

async function insertMetric(client: PoolClient, snapshotId: string, metric: Metric) {
  await client.query(
    `INSERT INTO metrics (
       snapshot_id, label, value, unit, question, role, geo, period,
       source_id, source_url, fetched_at,
       reference, kind, authority, in_force, text_url, body
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, $10, $11,
       $12, $13, $14, $15, $16, $17
     )`,
    [
      snapshotId,
      metric.label,
      String(metric.value),
      metric.unit ?? null,
      metric.question,
      metric.role ?? null,
      metric.geo ?? null,
      metric.period ?? null,
      metric.sourceId,
      metric.sourceUrl,
      metric.fetchedAt,
      metric.reference ?? null,
      metric.kind ?? null,
      metric.authority ?? null,
      metric.inForce ?? null,
      metric.textUrl ?? null,
      metric.text ?? null,
    ],
  );
}

function toMetric(row: MetricDbRow): Metric {
  const metric: Metric = {
    label: readableLabel(row.label),
    value: integerOrText(row.value),
    question: row.question,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    fetchedAt: new Date(row.fetched_at).toISOString(),
  };
  if (row.unit) metric.unit = row.unit;
  if (row.role) metric.role = row.role;
  if (row.geo) metric.geo = row.geo;
  if (row.period) metric.period = row.period;
  if (row.reference) metric.reference = row.reference;
  if (row.kind) metric.kind = row.kind;
  if (row.authority) metric.authority = row.authority;
  if (row.in_force) metric.inForce = dateOnly(row.in_force);
  if (row.text_url) metric.textUrl = row.text_url;
  if (row.body) metric.text = row.body;
  return metric;
}

function integerOrText(value: string): number | string {
  return /^-?\d+$/.test(value) ? Number(value) : value;
}

function dateOnly(value: string | Date): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}
