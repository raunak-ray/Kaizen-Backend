import { eq, or } from "drizzle-orm";
import { db } from "@db/client";
import { Project } from "@db/schema";
import type { ProjectVisibility } from "./project.types";

export type ProjectRow = typeof Project.$inferSelect;

interface CreateProjectInput {
  key: string;
  name: string;
  description?: string;
  ownerId: string;
  visibility: ProjectVisibility;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
  isArchived?: boolean;
}

export async function create(input: CreateProjectInput): Promise<ProjectRow> {
  const [project] = await db
    .insert(Project)
    .values({
      key: input.key,
      name: input.name,
      description: input.description,
      owner_id: input.ownerId,
      visibility: input.visibility,
    })
    .returning();

  return project;
}

export async function findAll(accessibleTo: string): Promise<ProjectRow[]> {
  return db
    .select()
    .from(Project)
    .where(or(eq(Project.visibility, "public"), eq(Project.owner_id, accessibleTo)));
}

export async function findById(id: string): Promise<ProjectRow | undefined> {
  const [project] = await db.select().from(Project).where(eq(Project.id, id));
  return project;
}

export async function findByKey(key: string): Promise<ProjectRow | undefined> {
  const [project] = await db.select().from(Project).where(eq(Project.key, key));
  return project;
}

export async function update(
  id: string,
  input: UpdateProjectInput,
): Promise<ProjectRow | undefined> {
  const [project] = await db
    .update(Project)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.isArchived !== undefined && { is_archived: input.isArchived }),
      updated_at: new Date(),
    })
    .where(eq(Project.id, id))
    .returning();

  return project;
}

export async function deleteById(id: string): Promise<void> {
  await db.delete(Project).where(eq(Project.id, id));
}

export async function existsByKey(key: string): Promise<boolean> {
  const [project] = await db.select({ id: Project.id }).from(Project).where(eq(Project.key, key));

  return project !== undefined;
}
