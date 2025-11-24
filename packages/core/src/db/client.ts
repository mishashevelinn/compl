import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Resource } from "sst";

// Create a singleton database client
let _client: ReturnType<typeof createClient> | null = null;

export function createClient() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // This is needed for RDS connections
    }
  });

  // Return a drizzle client instance
  return drizzle(pool);
}

// Get or create the database client
export function getClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}