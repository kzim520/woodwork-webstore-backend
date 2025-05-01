import { Pool } from "pg";

/**
 * Creates and exports a PostgreSQL connection pool.
 *
 * - In production (e.g. Render, Supabase), it uses the DATABASE_URL from environment variables.
 * - In development, it falls back to a local PostgreSQL instance.
 *
 * Supabase requires SSL, so we configure SSL with `rejectUnauthorized: false`
 * to allow self-signed certificates.
 *
 * Local development assumes a user 'kevinzimmer', default host/port, and a
 * database named 'woodwork-webstore'.
 */
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Allow SSL connections with self-signed certs (e.g. Supabase)
        },
      }
    : {
        user: "kevinzimmer",         // Local PostgreSQL username
        host: "localhost",           // Local PostgreSQL host
        database: "woodwork-webstore", // Local database name
        port: 5432,                  // Default PostgreSQL port
      }
);
