import { and, eq, sql } from "drizzle-orm";
import { db } from "@db/client";
import { IssueType } from "@db/schema";

export type IssueTypeRow = typeof IssueType.$inferSelect;

// The tx handle drizzle passes into a db.transaction() callback. Repository
// functions that participate in a transaction accept this in place of `db`.
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | Transaction;

interface CreateIssueTypeInput {
  projectId: string;
  name: string;
  description?: string;
  icon?: string;
}

interface UpdateIssueTypeInput {
  name?: string;
  description?: string;
  icon?: string;
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
  input: CreateIssueTypeInput,
  executor: DbExecutor = db,
): Promise<IssueTypeRow> {
  const [type] = await executor
    .insert(IssueType)
    .values({
      project_id: input.projectId,
      name: input.name,
      description: input.description,
      icon: input.icon,
    })
    .returning();

  return type;
}

export async function findById(
  projectId: string,
  typeId: string,
): Promise<IssueTypeRow | undefined> {
  const [type] = await db
    .select()
    .from(IssueType)
    .where(and(eq(IssueType.project_id, projectId), eq(IssueType.id, typeId)));

  return type;
}

export async function findMany(
  projectId: string,
  executor: DbExecutor = db,
): Promise<IssueTypeRow[]> {
  return executor.select().from(IssueType).where(eq(IssueType.project_id, projectId));
}

export async function update(
  typeId: string,
  input: UpdateIssueTypeInput,
  executor: DbExecutor = db,
): Promise<IssueTypeRow | undefined> {
  const [type] = await executor
    .update(IssueType)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.icon !== undefined && { icon: input.icon }),
      updated_at: new Date(),
    })
    .where(eq(IssueType.id, typeId))
    .returning();

  return type;
}

export async function archive(typeId: string): Promise<IssueTypeRow | undefined> {
  const [type] = await db
    .update(IssueType)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(IssueType.id, typeId))
    .returning();

  return type;
}

export async function restore(typeId: string): Promise<IssueTypeRow | undefined> {
  const [type] = await db
    .update(IssueType)
    .set({ archived: false, updated_at: new Date() })
    .where(eq(IssueType.id, typeId))
    .returning();

  return type;
}

export async function exists(projectId: string, typeId: string): Promise<boolean> {
  return (await findById(projectId, typeId)) !== undefined;
}

export async function findByName(
  projectId: string,
  name: string,
  executor: DbExecutor = db,
): Promise<IssueTypeRow | undefined> {
  const [type] = await executor
    .select()
    .from(IssueType)
    .where(and(eq(IssueType.project_id, projectId), eq(IssueType.name, name)));

  return type;
}
