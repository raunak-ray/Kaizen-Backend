import { z } from "zod";
import { PROJECT_ROLES } from "./project-member.constants";

const projectRoleSchema = z.enum([
  PROJECT_ROLES.OWNER,
  PROJECT_ROLES.ADMIN,
  PROJECT_ROLES.MEMBER,
  PROJECT_ROLES.VIEWER,
]);

export const inviteMemberSchema = z.object({
  userId: z.uuid("Invalid user id"),
  role: projectRoleSchema.optional(),
});

export const updateMemberRoleSchema = z.object({
  role: projectRoleSchema,
});

export const projectIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const memberIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  memberId: z.uuid("Invalid member id"),
});
