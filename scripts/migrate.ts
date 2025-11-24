import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Main migration function
async function runMigration() {
  // Get the DATABASE_URL from SST secrets
  const result = execSync("npx sst secret list").toString();
  const match = result.match(/DATABASE_URL=(.+)/);
  
  if (!match || !match[1]) {
    console.error("Could not find DATABASE_URL in SST secrets");
    process.exit(1);
  }
  
  const databaseUrl = match[1].trim();
  
  console.log("Starting database migration...");
  
  // Create a PostgreSQL connection pool with SSL enabled
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // This is needed for RDS connections
    }
  });

  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "0000_create_complaints_table.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    console.log("Executing migration...");
    
    // Execute the SQL
    await pool.query(migrationSQL);
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);