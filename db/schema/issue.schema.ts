import { boolean, index, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { Project } from "./project.schema";
import { User } from "./user.schema";

export const issueStatusEnum = pgEnum("issue_status", ["todo", "in-progress", "done"]);

export const issuePriorityEnum = pgEnum("issue_priority", ["low", "medium", "high"]);

export const issueTypeEnum = pgEnum("issue_type", ["task", "bug-fix"]);

export const Issue = pgTable(
  "tbl_issue",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    project_id: uuid("project_id")
      .references(() => Project.id)
      .notNull(),

    reporter_id: uuid("reporter_id")
      .references(() => User.id)
      .notNull(),

    assignee_id: uuid("assignee_id").references(() => User.id),

    title: varchar("title", { length: 255 }).notNull(),

    description: varchar("description", {
      length: 2000,
    }),

    status: issueStatusEnum("status").default("todo").notNull(),

    priority: issuePriorityEnum("priority").default("medium").notNull(),

    type: issueTypeEnum("type").default("task").notNull(),

    archived: boolean("archived").default(false).notNull(),

    deleted_at: timestamp("deleted_at"),

    created_at: timestamp("created_at").defaultNow().notNull(),

    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_issue_project_id").on(table.project_id),

    index("idx_issue_assignee_id").on(table.assignee_id),

    index("idx_issue_reporter_id").on(table.reporter_id),

    index("idx_issue_status").on(table.status),

    index("idx_issue_priority").on(table.priority),

    index("idx_issue_type").on(table.type),
  ],
);
