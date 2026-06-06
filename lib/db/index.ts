import * as schema from "./schema";

type DB = any;

declare global {
  var __vendorbridge_db__: DB | undefined;
}

let db: DB;

if (globalThis.__vendorbridge_db__) {
  db = globalThis.__vendorbridge_db__;
} else {
  const isBun = typeof process !== "undefined" && !!(process as any).versions?.bun;

  if (isBun) {
    const { Database } = await import("bun:sqlite");
    const { drizzle } = await import("drizzle-orm/bun-sqlite");
    const client = new Database("./sqlite.db");
    client.exec("PRAGMA foreign_keys = ON;");
    db = drizzle(client, { schema });
  } else {
    const BetterSQLite3 = await import("better-sqlite3");
    const Database = BetterSQLite3.default as any;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const client = new Database("./sqlite.db");
    client.exec("PRAGMA foreign_keys = ON;");
    db = drizzle(client, { schema });
  }

  globalThis.__vendorbridge_db__ = db;
}

export { db };
