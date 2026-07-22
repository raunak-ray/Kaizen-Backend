import {
  boolean,
  foreignKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { User } from "./user.schema";

export const projectVisibilityEnum = pgEnum("project_visibility", ["private", "public"]);

export const Project = pgTable("tbl_project", {
  id: uuid("id").defaultRandom().primaryKey(),

  key: text("key").unique().notNull(),

  name: varchar("name", { length: 50 }).notNull(),

  description: varchar("description", { length: 255 }),

  owner_id: uuid("owner_id")
    .notNull()
    .references(() => User.id),

  visibility: projectVisibilityEnum("visibility").default("private").notNull(),

  is_archived: boolean("is_archived").default(false).notNull(),

  created_at: timestamp("created_at").defaultNow().notNull(),

  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
