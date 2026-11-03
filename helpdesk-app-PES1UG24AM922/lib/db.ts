import { Pool } from "pg";

const g = globalThis as unknown as { _pool?: Pool };

export const pool =
  g._pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") g._pool = pool;
