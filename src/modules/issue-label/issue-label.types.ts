export interface CreateIssueLabelDto {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateIssueLabelDto {
  name?: string;
  color?: string;
  description?: string;
}

export interface IssueLabelResponse {
  id: string;
  name: string;
  projectId: string;
  color: string;
  description: string | null;
  archieved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
