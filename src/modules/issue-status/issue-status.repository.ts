import { and, eq, sql } from "drizzle-orm";
import { db } from "@db/client";
import { IssueStatus } from "@db/schema";
import type { IssueStatusCategory } from "./issue-status.types";

export type IssueStatusRow = typeof IssueStatus.$inferSelect;

// The tx handle drizzle passes into a db.transaction() callback. Repository
// functions that participate in a transaction accept this in place of `db`.
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | Transaction;

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

/**
 * Serializes concurrent create/rename operations for the same project using a
 * transaction-scoped Postgres advisory lock. Must be called as the first
 * statement inside the transaction that performs the uniqueness check and the
 * subsequent write, so two concurrent requests for the same project can't
 * both pass the check before either write commits.
 */
export async function lockProject(executor: DbExecutor, projectId: string): Promise<void> {
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${projectId}))`);
}

export async function create(
  input: CreateIssueStatusInput,
  executor: DbExecutor = db,
): Promise<IssueStatusRow> {
  const [status] = await executor
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

export async function findMany(
  projectId: string,
  executor: DbExecutor = db,
): Promise<IssueStatusRow[]> {
  return executor
    .select()
    .from(IssueStatus)
    .where(eq(IssueStatus.project_id, projectId))
    .orderBy(IssueStatus.position);
}

export async function update(
  statusId: string,
  input: UpdateIssueStatusInput,
  executor: DbExecutor = db,
): Promise<IssueStatusRow | undefined> {
  const [status] = await executor
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
  executor: DbExecutor = db,
): Promise<IssueStatusRow | undefined> {
  const [status] = await executor
    .select()
    .from(IssueStatus)
    .where(and(eq(IssueStatus.project_id, projectId), eq(IssueStatus.name, name)));

  return status;
}
