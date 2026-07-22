import type { PROJECT_VISIBILITY } from "./project.constants";

export type ProjectVisibility = (typeof PROJECT_VISIBILITY)[keyof typeof PROJECT_VISIBILITY];

export interface CreateProjectDto {
  name: string;
  description?: string;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
}

export interface ProjectResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: ProjectVisibility;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
