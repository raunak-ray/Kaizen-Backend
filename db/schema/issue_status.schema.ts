import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { Project } from "./project.schema";

export const issueStatusCategoryEnum = pgEnum("issue_status_category_enum", [
  "todo",
  "in-progress",
  "done",
]);

export const IssueStatus = pgTable(
  "tbl_issue_status",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .references(() => Project.id)
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    category: issueStatusCategoryEnum("category").default("todo").notNull(),
    position: integer("position").notNull(),
    archived: boolean("archived").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("uq_issue_status_project_name").on(table.project_id, table.name),
    index("idx_issue_status_project_id").on(table.project_id),
    index("idx_issue_status_category").on(table.category),
    index("idx_issue_status_position").on(table.position),
  ],
);
