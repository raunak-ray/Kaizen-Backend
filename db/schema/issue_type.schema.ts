import { boolean, index, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { Project } from "./project.schema";

export const IssueType = pgTable(
  "tbl_issue_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .references(() => Project.id)
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),
    icon: varchar("icon", { length: 50 }),
    archived: boolean("archived").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_issue_type_project_name").on(table.project_id, table.name),
    index("idx_issue_type_project_id").on(table.project_id),
  ],
);
