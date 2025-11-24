import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default {
  schema: "./packages/core/src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  driver: "pg", // This is the correct driver for PostgreSQL
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "",
  },
} satisfies Config;