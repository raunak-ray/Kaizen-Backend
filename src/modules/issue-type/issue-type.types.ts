export interface CreateIssueTypeDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateIssueTypeDto {
  name?: string;
  description?: string;
  icon?: string;
}

export interface IssueTypeResponse {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  icon: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
