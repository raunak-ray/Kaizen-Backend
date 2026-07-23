import type { PROJECT_ROLES } from "./project-member.constants";

export type ProjectRole = (typeof PROJECT_ROLES)[keyof typeof PROJECT_ROLES];

export interface InviteMemberDto {
  userId: string;
  role?: ProjectRole;
}

export interface UpdateMemberRoleDto {
  role: ProjectRole;
}

export interface ProjectMemberResponse {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
