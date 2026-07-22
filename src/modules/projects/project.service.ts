import { AppError } from "@/lib/errors";
import * as projectRepository from "./project.repository";
import type { ProjectRow } from "./project.repository";
import {
  PROJECT_ERRORS,
  PROJECT_KEY_BASE_LENGTH,
  PROJECT_KEY_FALLBACK,
  PROJECT_KEY_MAX_SUFFIX_ATTEMPTS,
  PROJECT_KEY_MIN_LENGTH,
  PROJECT_VISIBILITY,
} from "./project.constants";
import type { CreateProjectDto, ProjectResponse, UpdateProjectDto } from "./project.types";

class ProjectService {
  async create(dto: CreateProjectDto, ownerId: string): Promise<ProjectResponse> {
    const key = await this.generateUniqueKey(dto.name);

    const project = await projectRepository.create({
      key,
      name: dto.name,
      description: dto.description,
      ownerId,
      visibility: dto.visibility ?? PROJECT_VISIBILITY.PRIVATE,
    });

    return this.mapProject(project);
  }

  async findAll(userId: string): Promise<ProjectResponse[]> {
    const projects = await projectRepository.findAll(userId);
    return projects.map((project) => this.mapProject(project));
  }

  async findById(id: string, userId: string): Promise<ProjectResponse> {
    const project = await this.loadAccessibleProject(id, userId);
    return this.mapProject(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string): Promise<ProjectResponse> {
    const project = await this.loadProjectOrThrow(id);
    this.validateOwner(project, userId);
    this.ensureNotArchived(project);

    const updated = await projectRepository.update(id, dto);
    return this.mapProject(updated as ProjectRow);
  }

  async archive(id: string, userId: string): Promise<ProjectResponse> {
    const project = await this.loadProjectOrThrow(id);
    this.validateOwner(project, userId);

    const updated = await projectRepository.update(id, { isArchived: true });
    return this.mapProject(updated as ProjectRow);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.loadProjectOrThrow(id);
    this.validateOwner(project, userId);

    await projectRepository.deleteById(id);
  }

  private async loadProjectOrThrow(id: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(id);

    if (!project) {
      throw new AppError(
        PROJECT_ERRORS.PROJECT_NOT_FOUND.message,
        404,
        PROJECT_ERRORS.PROJECT_NOT_FOUND.code,
      );
    }

    return project;
  }

  private async loadAccessibleProject(id: string, userId: string): Promise<ProjectRow> {
    const project = await this.loadProjectOrThrow(id);

    // Private projects are only visible to their owner until membership
    // exists; a 404 (not 403) avoids leaking that a private project exists.
    if (project.visibility === PROJECT_VISIBILITY.PRIVATE && project.owner_id !== userId) {
      throw new AppError(
        PROJECT_ERRORS.PROJECT_NOT_FOUND.message,
        404,
        PROJECT_ERRORS.PROJECT_NOT_FOUND.code,
      );
    }

    return project;
  }

  private validateOwner(project: ProjectRow, userId: string): void {
    if (project.owner_id !== userId) {
      throw new AppError(PROJECT_ERRORS.FORBIDDEN.message, 403, PROJECT_ERRORS.FORBIDDEN.code);
    }
  }

  private ensureNotArchived(project: ProjectRow): void {
    if (project.is_archived) {
      throw new AppError(
        PROJECT_ERRORS.PROJECT_ARCHIVED.message,
        409,
        PROJECT_ERRORS.PROJECT_ARCHIVED.code,
      );
    }
  }

  private async generateUniqueKey(name: string): Promise<string> {
    const base = this.generateProjectKey(name);
    return this.ensureUniqueKey(base);
  }

  private generateProjectKey(name: string): string {
    const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const base = letters.slice(0, PROJECT_KEY_BASE_LENGTH);

    return base.length >= PROJECT_KEY_MIN_LENGTH ? base : PROJECT_KEY_FALLBACK;
  }

  private async ensureUniqueKey(base: string): Promise<string> {
    if (!(await projectRepository.existsByKey(base))) {
      return base;
    }

    for (let suffix = 1; suffix <= PROJECT_KEY_MAX_SUFFIX_ATTEMPTS; suffix++) {
      const candidate = `${base}${suffix}`;

      if (!(await projectRepository.existsByKey(candidate))) {
        return candidate;
      }
    }

    throw new AppError(
      PROJECT_ERRORS.KEY_GENERATION_FAILED.message,
      500,
      PROJECT_ERRORS.KEY_GENERATION_FAILED.code,
    );
  }

  private mapProject(project: ProjectRow): ProjectResponse {
    return {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      ownerId: project.owner_id,
      visibility: project.visibility,
      isArchived: project.is_archived,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  }
}

export const projectService = new ProjectService();
