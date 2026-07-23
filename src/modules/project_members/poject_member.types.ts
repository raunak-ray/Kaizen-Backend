export interface InviteMemberDto {
  userId: string;
  role: string;
}

export interface UpdateMemberRoleDto {
  userId: string;
  role: string;
}

export interface ProjectMemberResponse {
  id: string;
  projectId: string;
  role: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}
