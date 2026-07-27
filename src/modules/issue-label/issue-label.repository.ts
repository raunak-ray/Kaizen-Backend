import { db } from "@db/client";
import { IssueLabel } from "@db/schema";
import { and, eq } from "drizzle-orm";

interface CreateIssueLabelInput {
  projectId: string;
  name: string;
  color: string;
  description?: string;
}

interface UpdateIssueLabelInput {
  name?: string;
  color?: string;
  description?: string;
}

export async function create(input: CreateIssueLabelInput) {
  const [label] = await db
    .insert(IssueLabel)
    .values({
      name: input.name,
      description: input.description,
      project_id: input.projectId,
      color: input.color,
    })
    .returning();
  return label;
}

export async function findById(projectId: string, labelId: string) {
  const [label] = await db
    .select()
    .from(IssueLabel)
    .where(and(eq(IssueLabel.project_id, projectId), eq(IssueLabel.id, labelId)));

  return label;
}

export async function findMany(projectId: string) {
  return db.select().from(IssueLabel).where(eq(IssueLabel.project_id, projectId));
}

export async function update(labelId: string, input: UpdateIssueLabelInput) {
  const [label] = await db
    .update(IssueLabel)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
    })
    .where(eq(IssueLabel.id, labelId))
    .returning();

  return label;
}

export async function archive(labelId: string) {
  const [label] = await db
    .update(IssueLabel)
    .set({ archieved: true, updated_at: new Date() })
    .where(eq(IssueLabel.id, labelId))
    .returning();
  return label;
}

export async function restore(labelId: string) {
  const [label] = await db
    .update(IssueLabel)
    .set({ archieved: false, updated_at: new Date() })
    .where(eq(IssueLabel.id, labelId))
    .returning();
  return label;
}

export async function exists(projectId: string, labelId: string) {
  return (await findById(projectId, labelId)) !== undefined;
}

export async function findByName(projectId: string, name: string) {
  const [label] = await db
    .select()
    .from(IssueLabel)
    .where(and(eq(IssueLabel.project_id, projectId), eq(IssueLabel.name, name)));

  return label;
}
