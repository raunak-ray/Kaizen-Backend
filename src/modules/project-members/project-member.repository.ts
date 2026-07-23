import { and, eq } from "drizzle-orm";
import { db } from "@db/client";
import { ProjectMember, User } from "@db/schema";
import type { ProjectRole } from "./project-member.types";

export type ProjectMemberRow = typeof ProjectMember.$inferSelect;

export interface ProjectMemberWithUser extends ProjectMemberRow {
  user: Pick<typeof User.$inferSelect, "id" | "first_name" | "last_name" | "email">;
}

interface CreateProjectMemberInput {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export async function create(input: CreateProjectMemberInput): Promise<ProjectMemberRow> {
  const [member] = await db
    .insert(ProjectMember)
    .values({ project_id: input.projectId, user_id: input.userId, role: input.role })
    .returning();

  return member;
}

export async function findAll(projectId: string): Promise<ProjectMemberWithUser[]> {
  const rows = await db
    .select({ member: ProjectMember, user: User })
    .from(ProjectMember)
    .innerJoin(User, eq(ProjectMember.user_id, User.id))
    .where(eq(ProjectMember.project_id, projectId));

  return rows.map(({ member, user }) => ({ ...member, user }));
}

export async function findById(id: string): Promise<ProjectMemberRow | undefined> {
  const [member] = await db.select().from(ProjectMember).where(eq(ProjectMember.id, id));
  return member;
}

export async function findByProjectAndUser(
  projectId: string,
  userId: string,
): Promise<ProjectMemberRow | undefined> {
  const [member] = await db
    .select()
    .from(ProjectMember)
    .where(and(eq(ProjectMember.project_id, projectId), eq(ProjectMember.user_id, userId)));
  return member;
}

export async function update(id: string, role: ProjectRole): Promise<ProjectMemberRow | undefined> {
  const [member] = await db
    .update(ProjectMember)
    .set({ role })
    .where(eq(ProjectMember.id, id))
    .returning();
  return member;
}

export async function deleteById(id: string): Promise<void> {
  await db.delete(ProjectMember).where(eq(ProjectMember.id, id));
}

export async function exists(projectId: string, userId: string): Promise<boolean> {
  return (await findByProjectAndUser(projectId, userId)) !== undefined;
}
