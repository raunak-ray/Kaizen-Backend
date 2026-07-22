import { logger } from "@config/logger";
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

    logger.info(
      { projectId: project.id, key: project.key, ownerId, visibility: project.visibility },
      "Project created",
    );

    return this.mapProject(project);
  }

  async findAll(userId: string): Promise<ProjectResponse[]> {
    const projects = await projectRepository.findAll(userId);

    logger.debug({ userId, count: projects.length }, "Projects listed");

    return projects.map((project) => this.mapProject(project));
  }

  async findById(id: string, userId: string): Promise<ProjectResponse> {
    const project = await this.loadAccessibleProject(id, userId);

    logger.debug({ projectId: id, userId }, "Project retrieved");

    return this.mapProject(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string): Promise<ProjectResponse> {
    const project = await this.loadProjectOrThrow(id, "update");
    this.validateOwner(project, userId, "update");
    this.ensureNotArchived(project, userId);

    const updated = await projectRepository.update(id, dto);

    logger.info({ projectId: id, userId, fields: Object.keys(dto) }, "Project updated");

    return this.mapProject(updated as ProjectRow);
  }

  async archive(id: string, userId: string): Promise<ProjectResponse> {
    const project = await this.loadProjectOrThrow(id, "archive");
    this.validateOwner(project, userId, "archive");

    const updated = await projectRepository.update(id, { isArchived: true });

    logger.info({ projectId: id, userId }, "Project archived");

    return this.mapProject(updated as ProjectRow);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.loadProjectOrThrow(id, "delete");
    this.validateOwner(project, userId, "delete");

    await projectRepository.deleteById(id);

    logger.info({ projectId: id, userId }, "Project deleted");
  }

  private async loadProjectOrThrow(id: string, operation: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(id);

    if (!project) {
      logger.warn({ projectId: id, operation }, "Project not found");
      throw new AppError(
        PROJECT_ERRORS.PROJECT_NOT_FOUND.message,
        404,
        PROJECT_ERRORS.PROJECT_NOT_FOUND.code,
      );
    }

    return project;
  }

  private async loadAccessibleProject(id: string, userId: string): Promise<ProjectRow> {
    const project = await this.loadProjectOrThrow(id, "read");

    // Private projects are only visible to their owner until membership
    // exists; a 404 (not 403) avoids leaking that a private project exists.
    if (project.visibility === PROJECT_VISIBILITY.PRIVATE && project.owner_id !== userId) {
      logger.warn({ projectId: id, userId }, "Blocked access to a private project");
      throw new AppError(
        PROJECT_ERRORS.PROJECT_NOT_FOUND.message,
        404,
        PROJECT_ERRORS.PROJECT_NOT_FOUND.code,
      );
    }

    return project;
  }

  private validateOwner(project: ProjectRow, userId: string, operation: string): void {
    if (project.owner_id !== userId) {
      logger.warn(
        { projectId: project.id, ownerId: project.owner_id, userId, operation },
        "Blocked non-owner action on project",
      );
      throw new AppError(PROJECT_ERRORS.FORBIDDEN.message, 403, PROJECT_ERRORS.FORBIDDEN.code);
    }
  }

  private ensureNotArchived(project: ProjectRow, userId: string): void {
    if (project.is_archived) {
      logger.warn({ projectId: project.id, userId }, "Blocked update to an archived project");
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
        logger.debug({ base, candidate, suffix }, "Resolved project key collision");
        return candidate;
      }
    }

    logger.warn({ base }, "Exhausted project key suffix attempts");
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
