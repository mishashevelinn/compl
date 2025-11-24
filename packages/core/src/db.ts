// Database connection helper using the pg driver
// This module provides a simple way to connect to PostgreSQL using raw SQL

import { Pool, QueryResult } from "pg";
import { Resource } from "sst";

// Create a connection pool to PostgreSQL
// WHY a pool? Lambda functions are reused, so we can reuse connections across invocations
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    console.log("[DB] Creating new PostgreSQL connection pool");
    
    // Access the DATABASE_URL secret via the Resource object (injected by SST)
    const connectionString = Resource.DATABASE_URL.value;
    
    pool = new Pool({
      connectionString,
      // Lambda best practices: limit connections since many Lambdas might run concurrently
      max: 1, // Each Lambda instance gets 1 connection
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Log connection errors
    pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error:", err);
    });
  }

  return pool;
}

// Execute a SQL query with parameters (prevents SQL injection)
export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const client = getPool();
  
  console.log("[DB] Executing query:", sql.substring(0, 100), "...");
  console.log("[DB] Parameters:", JSON.stringify(params));

  try {
    const result = await client.query<T>(sql, params);
    console.log("[DB] Query returned", result.rowCount, "row(s)");
    return result;
  } catch (error) {
    console.error("[DB] Query failed:", error);
    throw error;
  }
}

// Close the pool (useful for cleanup, though Lambda usually handles this)
export async function closePool(): Promise<void> {
  if (pool) {
    console.log("[DB] Closing connection pool");
    await pool.end();
    pool = null;
  }
}



