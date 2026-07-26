import { and, eq, sql } from "drizzle-orm";
import { db } from "@db/client";
import { IssuePriority } from "@db/schema";

export type IssuePriorityRow = typeof IssuePriority.$inferSelect;

// The tx handle drizzle passes into a db.transaction() callback. Repository
// functions that participate in a transaction accept this in place of `db`.
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | Transaction;

interface CreateIssuePriorityInput {
  projectId: string;
  name: string;
  level: number;
  color: string;
}

interface UpdateIssuePriorityInput {
  name?: string;
  level?: number;
  color?: string;
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
  input: CreateIssuePriorityInput,
  executor: DbExecutor = db,
): Promise<IssuePriorityRow> {
  const [priority] = await executor
    .insert(IssuePriority)
    .values({
      project_id: input.projectId,
      name: input.name,
      level: input.level,
      color: input.color,
    })
    .returning();

  return priority;
}

export async function findById(
  projectId: string,
  priorityId: string,
): Promise<IssuePriorityRow | undefined> {
  const [priority] = await db
    .select()
    .from(IssuePriority)
    .where(and(eq(IssuePriority.project_id, projectId), eq(IssuePriority.id, priorityId)));

  return priority;
}

export async function findMany(
  projectId: string,
  executor: DbExecutor = db,
): Promise<IssuePriorityRow[]> {
  return executor
    .select()
    .from(IssuePriority)
    .where(eq(IssuePriority.project_id, projectId))
    .orderBy(IssuePriority.level);
}

export async function update(
  priorityId: string,
  input: UpdateIssuePriorityInput,
  executor: DbExecutor = db,
): Promise<IssuePriorityRow | undefined> {
  const [priority] = await executor
    .update(IssuePriority)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.level !== undefined && { level: input.level }),
      ...(input.color !== undefined && { color: input.color }),
      updated_at: new Date(),
    })
    .where(eq(IssuePriority.id, priorityId))
    .returning();

  return priority;
}

export async function archive(priorityId: string): Promise<IssuePriorityRow | undefined> {
  const [priority] = await db
    .update(IssuePriority)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(IssuePriority.id, priorityId))
    .returning();

  return priority;
}

export async function restore(priorityId: string): Promise<IssuePriorityRow | undefined> {
  const [priority] = await db
    .update(IssuePriority)
    .set({ archived: false, updated_at: new Date() })
    .where(eq(IssuePriority.id, priorityId))
    .returning();

  return priority;
}

export async function exists(projectId: string, priorityId: string): Promise<boolean> {
  return (await findById(projectId, priorityId)) !== undefined;
}

export async function findByName(
  projectId: string,
  name: string,
  executor: DbExecutor = db,
): Promise<IssuePriorityRow | undefined> {
  const [priority] = await executor
    .select()
    .from(IssuePriority)
    .where(and(eq(IssuePriority.project_id, projectId), eq(IssuePriority.name, name)));

  return priority;
}
