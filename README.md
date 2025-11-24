# The Complaint Box

A serverless, event-driven application built with SST v3 (Ion) on AWS. This project demonstrates microservices architecture where an API receives complaints and an Event Bus routes them based on urgency.

## Architecture

1. **Ingestion:** API Gateway → Lambda → PostgreSQL → EventBridge
2. **Routing:** EventBridge routes based on urgency:
   - `URGENT` → SNS Topic (Admin Alert)
   - `NORMAL` → SQS Queue → Lambda (Report Generator)

## Tech Stack

- **Framework:** SST v3 (Ion)
- **Language:** TypeScript (Node.js)
- **Cloud:** AWS (Lambda, EventBridge, SNS, SQS, API Gateway)
- **Database:** PostgreSQL (using `pg` driver with raw SQL)

## Database Schema

The `complaints` table includes:
- `id` - Auto-incrementing primary key
- `customer_name` - Customer's name
- `message` - The complaint text
- `urgency` - Either "URGENT" or "NORMAL"
- `status` - Lifecycle tracking: "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"
- `created_at` - Timestamp when created
- `updated_at` - Timestamp when last modified (auto-updated)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

You need a PostgreSQL database. You can use:
- **Local:** Install PostgreSQL locally
- **Cloud:** Use AWS RDS, Neon, Supabase, or any PostgreSQL provider

Your connection string should look like:
```
postgresql://username:password@host:5432/database_name
```

### 3. Run Database Migration

Set your database URL and run the migration:

```bash
export DATABASE_URL="postgresql://username:password@host:5432/database_name"
npm run migrate
```

This will create the `complaints` table with all necessary indexes and triggers.

### 4. Configure SST Secret

SST needs to know your database URL. Set it as a secret:

```bash
npx sst secret set DATABASE_URL "postgresql://username:password@host:5432/database_name"
```

This stores the secret securely in AWS Parameter Store.

### 5. Start Development

```bash
npm run dev
```

This starts the SST development environment with live Lambda reloading.

## Project Structure

```
compl/
├── packages/
│   ├── core/              # Shared code (types, database helpers)
│   │   └── src/
│   │       ├── db.ts      # PostgreSQL connection pool
│   │       ├── types.ts   # TypeScript interfaces
│   │       └── sql/
│   │           └── schema.sql  # Database schema
│   └── functions/         # Lambda function handlers
│       └── src/
├── scripts/
│   └── migrate.ts         # Database migration script
├── sst.config.ts          # SST infrastructure definition
└── package.json
```

## Scripts

- `npm run dev` - Start SST development mode
- `npm run build` - Build the application
- `npm run deploy` - Deploy to AWS
- `npm run remove` - Remove all AWS resources
- `npm run migrate` - Run database migrations

## Learning Notes

This project follows a **learning-first** approach:
- **No ORM:** Uses raw SQL to understand database operations
- **Explicit code:** Avoids "clever" abstractions
- **Generous logging:** `console.log` everywhere for CloudWatch visibility
- **Comments:** Explains the "WHY" behind key decisions

## Next Steps

- [ ] Implement API Gateway + Ingestion Lambda
- [ ] Set up EventBridge routing rules
- [ ] Create SNS topic for urgent alerts
- [ ] Create SQS queue + processor for normal complaints
- [ ] Add testing instructions



