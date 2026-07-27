import { boolean, index, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { Project } from "./project.schema";

export const IssueLabel = pgTable(
  "tbl_issue_label",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .references(() => Project.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    description: varchar("description", { length: 255 }),
    archived: boolean("archived").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_issue_label_project_name").on(table.project_id, table.name),
    index("idx_issue_label_project_id").on(table.project_id),
    index("idx_issue_label_name").on(table.name),
  ],
);
