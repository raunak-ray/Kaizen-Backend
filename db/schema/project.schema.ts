import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { User } from "./user.schema";

export const projectVisibilityEnum = pgEnum("project_visibility", ["private", "public"]);

export const Project = pgTable(
  "tbl_project",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    key: text("key").unique().notNull(),

    name: varchar("name", { length: 100 }).notNull(),

    description: varchar("description", { length: 2000 }),

    owner_id: uuid("owner_id")
      .notNull()
      .references(() => User.id),

    visibility: projectVisibilityEnum("visibility").default("private").notNull(),

    is_archived: boolean("is_archived").default(false).notNull(),

    created_at: timestamp("created_at").defaultNow().notNull(),

    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tbl_project_owner_id_idx").on(table.owner_id),
    index("tbl_project_visibility_idx").on(table.visibility),
    index("tbl_project_is_archived_idx").on(table.is_archived),
  ],
);
