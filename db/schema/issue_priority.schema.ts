import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { Project } from "./project.schema";

export const IssuePriority = pgTable(
  "tbl_issue_priority",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .references(() => Project.id)
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    level: integer("level").notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    archived: boolean("archived").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_issue_priority_project_name").on(table.project_id, table.name),
    index("idx_issue_priority_project_id").on(table.project_id),
    index("idx_issue_priority_level").on(table.level),
  ],
);
