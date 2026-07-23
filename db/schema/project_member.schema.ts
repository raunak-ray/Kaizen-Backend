import { index, pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { Project } from "./project.schema";
import { User } from "./user.schema";

export const projectMemberRoleEnum = pgEnum("project_member_roles", [
  "owner",
  "admin",
  "viewer",
  "member",
]);

export const ProjectMember = pgTable(
  "tbl_project_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => Project.id),
    user_id: uuid("user_id")
      .notNull()
      .references(() => User.id),
    role: projectMemberRoleEnum("role").default("member").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("tbl_unique_project_member").on(table.project_id, table.user_id),
    index("idx_project_member_project_id").on(table.project_id),
    index("idx_project_member_user_id").on(table.user_id),
    index("idx_project_member_role").on(table.role),
  ],
);
