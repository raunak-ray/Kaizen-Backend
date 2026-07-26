export interface CreateIssuePriorityDto {
  name: string;
  level?: number;
  color?: string;
}

export interface UpdateIssuePriorityDto {
  name?: string;
  level?: number;
  color?: string;
}

export interface IssuePriorityResponse {
  id: string;
  projectId: string;
  name: string;
  level: number;
  color: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
