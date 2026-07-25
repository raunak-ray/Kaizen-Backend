import { and, eq } from "drizzle-orm";
import { db } from "@db/client";
import { IssueStatus } from "@db/schema";
import type { IssueStatusCategory } from "./issue-status.types";

export type IssueStatusRow = typeof IssueStatus.$inferSelect;

interface CreateIssueStatusInput {
  projectId: string;
  name: string;
  category: IssueStatusCategory;
  position: number;
}

interface UpdateIssueStatusInput {
  name?: string;
  category?: IssueStatusCategory;
  position?: number;
}

export async function create(input: CreateIssueStatusInput): Promise<IssueStatusRow> {
  const [status] = await db
    .insert(IssueStatus)
    .values({
      project_id: input.projectId,
      name: input.name,
      category: input.category,
      position: input.position,
    })
    .returning();

  return status;
}

export async function findById(
  projectId: string,
  statusId: string,
): Promise<IssueStatusRow | undefined> {
  const [status] = await db
    .select()
    .from(IssueStatus)
    .where(and(eq(IssueStatus.project_id, projectId), eq(IssueStatus.id, statusId)));

  return status;
}

export async function findMany(projectId: string): Promise<IssueStatusRow[]> {
  return db
    .select()
    .from(IssueStatus)
    .where(eq(IssueStatus.project_id, projectId))
    .orderBy(IssueStatus.position);
}

export async function update(
  statusId: string,
  input: UpdateIssueStatusInput,
): Promise<IssueStatusRow | undefined> {
  const [status] = await db
    .update(IssueStatus)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.position !== undefined && { position: input.position }),
      updated_at: new Date(),
    })
    .where(eq(IssueStatus.id, statusId))
    .returning();

  return status;
}

export async function archive(statusId: string): Promise<IssueStatusRow | undefined> {
  const [status] = await db
    .update(IssueStatus)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(IssueStatus.id, statusId))
    .returning();

  return status;
}

export async function restore(statusId: string): Promise<IssueStatusRow | undefined> {
  const [status] = await db
    .update(IssueStatus)
    .set({ archived: false, updated_at: new Date() })
    .where(eq(IssueStatus.id, statusId))
    .returning();

  return status;
}

export async function exists(projectId: string, statusId: string): Promise<boolean> {
  return (await findById(projectId, statusId)) !== undefined;
}

export async function findByName(
  projectId: string,
  name: string,
): Promise<IssueStatusRow | undefined> {
  const [status] = await db
    .select()
    .from(IssueStatus)
    .where(and(eq(IssueStatus.project_id, projectId), eq(IssueStatus.name, name)));

  return status;
}
