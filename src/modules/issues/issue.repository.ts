import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@db/client";
import { Issue } from "@db/schema";
import type { IssuePriority, IssueStatus, IssueType, ListIssuesQuery } from "./issue.types";

export type IssueRow = typeof Issue.$inferSelect;

interface CreateIssueInput {
  projectId: string;
  reporterId: string;
  assigneeId?: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
}

interface UpdateIssueInput {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
}

const notDeleted = isNull(Issue.deleted_at);

export async function create(input: CreateIssueInput): Promise<IssueRow> {
  const [issue] = await db
    .insert(Issue)
    .values({
      project_id: input.projectId,
      reporter_id: input.reporterId,
      assignee_id: input.assigneeId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      type: input.type,
    })
    .returning();

  return issue;
}

export async function findById(projectId: string, issueId: string): Promise<IssueRow | undefined> {
  const [issue] = await db
    .select()
    .from(Issue)
    .where(and(eq(Issue.id, issueId), eq(Issue.project_id, projectId), notDeleted));

  return issue;
}

export async function findMany(
  projectId: string,
  filters: ListIssuesQuery,
): Promise<{ items: IssueRow[]; total: number }> {
  const conditions = [eq(Issue.project_id, projectId), notDeleted];

  if (filters.status !== undefined) conditions.push(eq(Issue.status, filters.status));
  if (filters.priority !== undefined) conditions.push(eq(Issue.priority, filters.priority));
  if (filters.type !== undefined) conditions.push(eq(Issue.type, filters.type));
  if (filters.assigneeId !== undefined) conditions.push(eq(Issue.assignee_id, filters.assigneeId));
  if (filters.archived !== undefined) conditions.push(eq(Issue.archived, filters.archived));

  const where = and(...conditions);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(Issue)
      .where(where)
      .orderBy(desc(Issue.created_at))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db.select({ total: count() }).from(Issue).where(where),
  ]);

  return { items, total };
}

export async function update(
  issueId: string,
  input: UpdateIssueInput,
): Promise<IssueRow | undefined> {
  const [issue] = await db
    .update(Issue)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.assigneeId !== undefined && { assignee_id: input.assigneeId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.type !== undefined && { type: input.type }),
      updated_at: new Date(),
    })
    .where(eq(Issue.id, issueId))
    .returning();

  return issue;
}

export async function archive(issueId: string): Promise<IssueRow | undefined> {
  const [issue] = await db
    .update(Issue)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(Issue.id, issueId))
    .returning();

  return issue;
}

export async function restore(issueId: string): Promise<IssueRow | undefined> {
  const [issue] = await db
    .update(Issue)
    .set({ archived: false, updated_at: new Date() })
    .where(eq(Issue.id, issueId))
    .returning();

  return issue;
}

export async function softDelete(issueId: string): Promise<void> {
  await db
    .update(Issue)
    .set({ deleted_at: new Date(), updated_at: new Date() })
    .where(eq(Issue.id, issueId));
}

export async function exists(projectId: string, issueId: string): Promise<boolean> {
  return (await findById(projectId, issueId)) !== undefined;
}
