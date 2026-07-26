import { logger } from "@config/logger";
import { db } from "@db/client";
import { AppError } from "@/lib/errors";
import * as projectMemberRepository from "@/modules/project-members/project-member.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import type { ProjectRow } from "@/modules/projects/project.repository";
import { ISSUE_TYPE_ERRORS } from "./issue-type.constants";
import * as issueTypeRepository from "./issue-type.repository";
import type { DbExecutor, IssueTypeRow } from "./issue-type.repository";
import type { CreateIssueTypeDto, IssueTypeResponse, UpdateIssueTypeDto } from "./issue-type.types";

const UNIQUE_VIOLATION = "23505";

class IssueTypeService {
  async create(
    projectId: string,
    dto: CreateIssueTypeDto,
    userId: string,
  ): Promise<IssueTypeResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);

    const type = await this.runLocked(projectId, async (tx) => {
      await this.ensureUniqueName(projectId, dto.name, undefined, tx);

      return issueTypeRepository.create(
        {
          projectId,
          name: dto.name,
          description: dto.description,
          icon: dto.icon,
        },
        tx,
      );
    });

    logger.info({ typeId: type.id, projectId, userId }, "Issue type created");

    return this.mapType(type);
  }

  async findById(projectId: string, typeId: string, userId: string): Promise<IssueTypeResponse> {
    await this.validateMembership(projectId, userId);
    const type = await this.ensureTypeExists(projectId, typeId);

    logger.debug({ typeId, projectId, userId }, "Issue type retrieved");

    return this.mapType(type);
  }

  async findAll(projectId: string, userId: string): Promise<IssueTypeResponse[]> {
    await this.validateMembership(projectId, userId);

    const types = await issueTypeRepository.findMany(projectId);

    logger.debug({ projectId, userId, count: types.length }, "Issue types listed");

    return types.map((type) => this.mapType(type));
  }

  async update(
    projectId: string,
    typeId: string,
    dto: UpdateIssueTypeDto,
    userId: string,
  ): Promise<IssueTypeResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureTypeExists(projectId, typeId);

    const updated = await this.runLocked(projectId, async (tx) => {
      if (dto.name !== undefined) {
        await this.ensureUniqueName(projectId, dto.name, typeId, tx);
      }

      return issueTypeRepository.update(typeId, dto, tx);
    });

    if (!updated) {
      logger.warn({ typeId, projectId, userId }, "Type disappeared during update");
      throw this.error("TYPE_NOT_FOUND", 404);
    }

    logger.info({ typeId, projectId, userId, fields: Object.keys(dto) }, "Issue type updated");

    return this.mapType(updated);
  }

  async archive(projectId: string, typeId: string, userId: string): Promise<IssueTypeResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureTypeExists(projectId, typeId);

    const updated = await issueTypeRepository.archive(typeId);

    if (!updated) {
      logger.warn({ typeId, projectId, userId }, "Type disappeared during archive");
      throw this.error("TYPE_NOT_FOUND", 404);
    }

    logger.info({ typeId, projectId, userId }, "Issue type archived");

    return this.mapType(updated);
  }

  async restore(projectId: string, typeId: string, userId: string): Promise<IssueTypeResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    const type = await this.ensureTypeExists(projectId, typeId);

    if (!type.archived) {
      logger.warn({ typeId, projectId, userId }, "Restore requested for a non-archived type");
      throw this.error("TYPE_NOT_ARCHIVED", 409);
    }

    const updated = await issueTypeRepository.restore(typeId);

    if (!updated) {
      logger.warn({ typeId, projectId, userId }, "Type disappeared during restore");
      throw this.error("TYPE_NOT_FOUND", 404);
    }

    logger.info({ typeId, projectId, userId }, "Issue type restored");

    return this.mapType(updated);
  }

  private async validateProject(projectId: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      logger.warn({ projectId }, "Issue type action requested for a missing project");
      throw this.error("PROJECT_NOT_FOUND", 404);
    }

    return project;
  }

  private async validateMembership(projectId: string, userId: string): Promise<ProjectRow> {
    const project = await this.validateProject(projectId);

    const isMember =
      project.owner_id === userId || (await projectMemberRepository.exists(projectId, userId));

    if (!isMember) {
      logger.warn({ projectId, userId }, "Blocked issue type action from a non-member");
      throw this.error("NOT_A_MEMBER", 403);
    }

    return project;
  }

  private validateOwner(project: ProjectRow, userId: string): void {
    if (project.owner_id !== userId) {
      logger.warn({ projectId: project.id, userId }, "Blocked issue type action from a non-owner");
      throw this.error("NOT_PROJECT_OWNER", 403);
    }
  }

  private async ensureTypeExists(projectId: string, typeId: string): Promise<IssueTypeRow> {
    const type = await issueTypeRepository.findById(projectId, typeId);

    if (!type) {
      logger.warn({ projectId, typeId }, "Issue type not found");
      throw this.error("TYPE_NOT_FOUND", 404);
    }

    return type;
  }

  private async ensureUniqueName(
    projectId: string,
    name: string,
    excludeTypeId: string | undefined,
    executor: DbExecutor,
  ): Promise<void> {
    const existing = await issueTypeRepository.findByName(projectId, name, executor);

    if (existing && existing.id !== excludeTypeId) {
      logger.warn({ projectId, name }, "Duplicate issue type name rejected");
      throw this.error("TYPE_ALREADY_EXISTS", 409);
    }
  }

  /**
   * Runs `fn` inside a transaction holding a per-project advisory lock, so
   * concurrent create/rename requests for the same project can't both pass a
   * uniqueness check before either write commits. The unique(project_id, name)
   * DB constraint is the backstop if the lock is ever bypassed; any resulting
   * unique-violation is translated to the same 409 the pre-check throws.
   */
  private async runLocked<T>(projectId: string, fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    try {
      return await db.transaction(async (tx) => {
        await issueTypeRepository.lockProject(tx, projectId);
        return fn(tx);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (this.isUniqueViolation(error)) {
        logger.warn({ projectId }, "Duplicate issue type name rejected by database constraint");
        throw this.error("TYPE_ALREADY_EXISTS", 409);
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === UNIQUE_VIOLATION
    );
  }

  private mapType(type: IssueTypeRow): IssueTypeResponse {
    return {
      id: type.id,
      projectId: type.project_id,
      name: type.name,
      description: type.description,
      icon: type.icon,
      archived: type.archived,
      createdAt: type.created_at,
      updatedAt: type.updated_at,
    };
  }

  private error(key: keyof typeof ISSUE_TYPE_ERRORS, statusCode: number): AppError {
    const error = ISSUE_TYPE_ERRORS[key];
    return new AppError(error.message, statusCode, error.code);
  }
}

export const issueTypeService = new IssueTypeService();
