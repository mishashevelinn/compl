import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Define the possible complaint statuses
export type ComplaintStatus = "NEW" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

// Define the complaint table schema
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  urgency: varchar("urgency", { length: 10 }).notNull().default("NORMAL"),
  status: varchar("status", { length: 20 }).notNull().default("NEW"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types for type safety
export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;