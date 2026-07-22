import { eq, sql } from "drizzle-orm";
import { db } from "@db/client";
import { User } from "@db/schema";

export type AuthUserRow = typeof User.$inferSelect;

interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export async function createUser(input: CreateUserInput): Promise<AuthUserRow> {
  const [user] = await db
    .insert(User)
    .values({
      email: input.email,
      password_hash: input.passwordHash,
      first_name: input.firstName,
      last_name: input.lastName,
    })
    .returning();

  return user;
}

export async function findById(id: string): Promise<AuthUserRow | undefined> {
  const [user] = await db.select().from(User).where(eq(User.id, id));
  return user;
}

export async function findByEmail(email: string): Promise<AuthUserRow | undefined> {
  const [user] = await db.select().from(User).where(eq(User.email, email));
  return user;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<AuthUserRow | undefined> {
  const [user] = await db
    .update(User)
    .set({
      ...(input.firstName !== undefined && { first_name: input.firstName }),
      ...(input.lastName !== undefined && { last_name: input.lastName }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
      updated_at: new Date(),
    })
    .where(eq(User.id, id))
    .returning();

  return user;
}

export async function incrementJwtVersion(id: string): Promise<AuthUserRow | undefined> {
  const [user] = await db
    .update(User)
    .set({ jwt_version: sql`${User.jwt_version} + 1`, updated_at: new Date() })
    .where(eq(User.id, id))
    .returning();

  return user;
}
