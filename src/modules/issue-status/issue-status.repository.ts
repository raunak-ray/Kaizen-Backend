import { db } from "@db/client";
import { IssueStatusCategory } from "./issue-status.types";
import { IssueStatus } from "@db/schema";
import { and, eq } from "drizzle-orm";

interface CreateIssueStatusInput {
  project_id: string;
  name: string;
  category: IssueStatusCategory;
  position: number;
}

interface UpdateIssueStatusInput {
  name?: string;
  category?: IssueStatusCategory;
  position?: number;
}

export async function create(input: CreateIssueStatusInput) {
  const [status] = await db
    .insert(IssueStatus)
    .values({
      project_id: input.project_id,
      name: input.name,
      category: input.category,
      position: input.position,
    })
    .returning();

  return status;
}

export async function findById(projectId: string, statusId: string) {
  const [status] = await db
    .select()
    .from(IssueStatus)
    .where(
      and(
        eq(IssueStatus.project_id, projectId),
        eq(IssueStatus.id, statusId),
        eq(IssueStatus.archived, false),
      ),
    );

  return status;
}

export async function findMany(projectId: string) {
  const statuses = await db
    .select()
    .from(IssueStatus)
    .where(and(eq(IssueStatus.project_id, projectId), eq(IssueStatus.archived, false)))
    .orderBy(IssueStatus.position);
  return statuses;
}

export async function update(input: UpdateIssueStatusInput) {
  const [status] = await db
    .update(IssueStatus)
    .set({
      ...(input.category !== undefined && { category: input.category }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.position !== undefined && { position: input.position }),
      updated_at: new Date(),
    })
    .returning();

  return status;
}

export async function archieve(statusId: string) {
  const [status] = await db
    .update(IssueStatus)
    .set({
      archived: true,
      updated_at: new Date(),
    })
    .where(eq(IssueStatus.id, statusId))
    .returning();

  return status;
}

export async function restore(statusId: string) {
  const [status] = await db
    .update(IssueStatus)
    .set({
      archived: false,
      updated_at: new Date(),
    })
    .where(eq(IssueStatus.id, statusId))
    .returning();

  return status;
}

export async function exists(statusId: string, projectId: string) {
  return findById(projectId, statusId) !== undefined;
}

export async function findByName(statusName: string) {
  const [status] = await db.select().from(IssueStatus).where(eq(IssueStatus.name, statusName));

  return status;
}
