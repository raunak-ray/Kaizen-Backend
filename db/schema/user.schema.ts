import { boolean, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const User = pgTable("tbl_user", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  password_hash: varchar("password_hash", { length: 255 }),
  first_name: varchar("first_name", { length: 255 }),
  last_name: varchar("last_name", { length: 255 }),
  jwt_version: integer("jwt_version").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
