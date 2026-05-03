import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import type {
  QueryResult,
  QueryResultRow,
} from "pg";
import {
  getRuntimeConfig,
  type DatabaseDriver,
} from "./runtime-config-service";

type DatabaseClient = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<QueryResult<T>>;
  release: () => void;
};

type DatabasePool = {
  connect: () => Promise<DatabaseClient>;
  end: () => Promise<void>;
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<QueryResult<T>>;
};

type DatabaseHandle = {
  driver: DatabaseDriver;
  pool: DatabasePool;
};

type MigrationRow = {
  file_name: string;
};

const migrationsDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../db/migrations",
);

let databaseHandlePromise: Promise<DatabaseHandle> | undefined;
let migrationPromise: Promise<void> | undefined;

const createDatabaseHandle = async (): Promise<DatabaseHandle> => {
  const config = getRuntimeConfig();

  if (config.databaseDriver === "pg-mem") {
    const { newDb } = await import("pg-mem");
    const db = newDb({
      autoCreateForeignKeyIndices: true,
    });
    const adapter = db.adapters.createPg();
    return {
      driver: "pg-mem",
      pool: new adapter.Pool() as unknown as DatabasePool,
    };
  }

  if (!config.databaseUrl) {
    throw new Error(
      "TRACECHECK_DATABASE_URL (or DATABASE_URL) is required for the PostgreSQL driver.",
    );
  }

  return {
    driver: "postgres",
    pool: new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    }),
  };
};

const loadMigrationFiles = async () => {
  const fileNames = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      sql: await readFile(resolve(migrationsDirectory, fileName), "utf8"),
    })),
  );
};

export const getDatabaseHandle = async () => {
  if (!databaseHandlePromise) {
    databaseHandlePromise = createDatabaseHandle().catch((error) => {
      databaseHandlePromise = undefined;
      throw error;
    });
  }

  return databaseHandlePromise;
};

export const getDatabasePool = async () => (await getDatabaseHandle()).pool;

export const queryDatabase = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
) => (await getDatabasePool()).query<T>(text, values);

export const runDatabaseMigrations = async () => {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    const { pool } = await getDatabaseHandle();
    const client = await pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tracecheck_schema_migrations (
          file_name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const appliedRows = await client.query<MigrationRow>(
        "SELECT file_name FROM tracecheck_schema_migrations",
      );
      const appliedFileNames = new Set(
        appliedRows.rows.map((row) => row.file_name),
      );
      const migrations = await loadMigrationFiles();

      for (const migration of migrations) {
        if (appliedFileNames.has(migration.fileName)) {
          continue;
        }

        await client.query("BEGIN");
        try {
          await client.query(migration.sql);
          await client.query(
            "INSERT INTO tracecheck_schema_migrations (file_name) VALUES ($1)",
            [migration.fileName],
          );
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
    } finally {
      client.release();
    }
  })();

  return migrationPromise;
};

export const bootstrapDatabase = async () => {
  const config = getRuntimeConfig();
  if (!config.databaseAutoMigrate) {
    await getDatabaseHandle();
    return;
  }

  await runDatabaseMigrations();
};

export const closeDatabaseConnections = async () => {
  if (!databaseHandlePromise) {
    return;
  }

  try {
    const { pool } = await databaseHandlePromise;
    await pool.end();
  } finally {
    databaseHandlePromise = undefined;
    migrationPromise = undefined;
  }
};

export const resetDatabaseStateForTests = async () => {
  await closeDatabaseConnections();
};
