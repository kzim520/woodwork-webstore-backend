import { Pool } from "pg";

// Use DATABASE_URL if provided (e.g., in Elastic Beanstalk), otherwise default to local DB for development
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Supabase to work over SSL
        },
      }
    : {
        user: "kevinzimmer",
        host: "localhost",
        database: "woodwork-webstore",
        password: "Fr4nk13d4muff69!",
        port: 5432,
      }
);
