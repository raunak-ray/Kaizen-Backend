import { logger } from "@config/logger";
import { db } from "@db/client";
import { AppError } from "@/lib/errors";
import * as projectMemberRepository from "@/modules/project-members/project-member.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import type { ProjectRow } from "@/modules/projects/project.repository";
import { DEFAULT_PRIORITY_COLOR, ISSUE_PRIORITY_ERRORS } from "./issue-priority.constants";
import * as issuePriorityRepository from "./issue-priority.repository";
import type { DbExecutor, IssuePriorityRow } from "./issue-priority.repository";
import type {
  CreateIssuePriorityDto,
  IssuePriorityResponse,
  UpdateIssuePriorityDto,
} from "./issue-priority.types";

const UNIQUE_VIOLATION = "23505";

class IssuePriorityService {
  async create(
    projectId: string,
    dto: CreateIssuePriorityDto,
    userId: string,
  ): Promise<IssuePriorityResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);

    const priority = await this.runLocked(projectId, async (tx) => {
      await this.ensureUniqueName(projectId, dto.name, undefined, tx);

      const level = dto.level ?? (await this.nextLevel(projectId, tx));

      return issuePriorityRepository.create(
        {
          projectId,
          name: dto.name,
          level,
          color: dto.color ?? DEFAULT_PRIORITY_COLOR,
        },
        tx,
      );
    });

    logger.info({ priorityId: priority.id, projectId, userId }, "Issue priority created");

    return this.mapPriority(priority);
  }

  async findById(
    projectId: string,
    priorityId: string,
    userId: string,
  ): Promise<IssuePriorityResponse> {
    await this.validateMembership(projectId, userId);
    const priority = await this.ensurePriorityExists(projectId, priorityId);

    logger.debug({ priorityId, projectId, userId }, "Issue priority retrieved");

    return this.mapPriority(priority);
  }

  async findAll(projectId: string, userId: string): Promise<IssuePriorityResponse[]> {
    await this.validateMembership(projectId, userId);

    const priorities = await issuePriorityRepository.findMany(projectId);

    logger.debug({ projectId, userId, count: priorities.length }, "Issue priorities listed");

    return priorities.map((priority) => this.mapPriority(priority));
  }

  async update(
    projectId: string,
    priorityId: string,
    dto: UpdateIssuePriorityDto,
    userId: string,
  ): Promise<IssuePriorityResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensurePriorityExists(projectId, priorityId);

    const updated = await this.runLocked(projectId, async (tx) => {
      if (dto.name !== undefined) {
        await this.ensureUniqueName(projectId, dto.name, priorityId, tx);
      }

      return issuePriorityRepository.update(priorityId, dto, tx);
    });

    if (!updated) {
      logger.warn({ priorityId, projectId, userId }, "Priority disappeared during update");
      throw this.error("PRIORITY_NOT_FOUND", 404);
    }

    logger.info(
      { priorityId, projectId, userId, fields: Object.keys(dto) },
      "Issue priority updated",
    );

    return this.mapPriority(updated);
  }

  async archive(
    projectId: string,
    priorityId: string,
    userId: string,
  ): Promise<IssuePriorityResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensurePriorityExists(projectId, priorityId);

    const updated = await issuePriorityRepository.archive(priorityId);

    if (!updated) {
      logger.warn({ priorityId, projectId, userId }, "Priority disappeared during archive");
      throw this.error("PRIORITY_NOT_FOUND", 404);
    }

    logger.info({ priorityId, projectId, userId }, "Issue priority archived");

    return this.mapPriority(updated);
  }

  async restore(
    projectId: string,
    priorityId: string,
    userId: string,
  ): Promise<IssuePriorityResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    const priority = await this.ensurePriorityExists(projectId, priorityId);

    if (!priority.archived) {
      logger.warn(
        { priorityId, projectId, userId },
        "Restore requested for a non-archived priority",
      );
      throw this.error("PRIORITY_NOT_ARCHIVED", 409);
    }

    const updated = await issuePriorityRepository.restore(priorityId);

    if (!updated) {
      logger.warn({ priorityId, projectId, userId }, "Priority disappeared during restore");
      throw this.error("PRIORITY_NOT_FOUND", 404);
    }

    logger.info({ priorityId, projectId, userId }, "Issue priority restored");

    return this.mapPriority(updated);
  }

  private async validateProject(projectId: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      logger.warn({ projectId }, "Issue priority action requested for a missing project");
      throw this.error("PROJECT_NOT_FOUND", 404);
    }

    return project;
  }

  private async validateMembership(projectId: string, userId: string): Promise<ProjectRow> {
    const project = await this.validateProject(projectId);

    const isMember =
      project.owner_id === userId || (await projectMemberRepository.exists(projectId, userId));

    if (!isMember) {
      logger.warn({ projectId, userId }, "Blocked issue priority action from a non-member");
      throw this.error("NOT_A_MEMBER", 403);
    }

    return project;
  }

  private validateOwner(project: ProjectRow, userId: string): void {
    if (project.owner_id !== userId) {
      logger.warn(
        { projectId: project.id, userId },
        "Blocked issue priority action from a non-owner",
      );
      throw this.error("NOT_PROJECT_OWNER", 403);
    }
  }

  private async ensurePriorityExists(
    projectId: string,
    priorityId: string,
  ): Promise<IssuePriorityRow> {
    const priority = await issuePriorityRepository.findById(projectId, priorityId);

    if (!priority) {
      logger.warn({ projectId, priorityId }, "Issue priority not found");
      throw this.error("PRIORITY_NOT_FOUND", 404);
    }

    return priority;
  }

  private async ensureUniqueName(
    projectId: string,
    name: string,
    excludePriorityId: string | undefined,
    executor: DbExecutor,
  ): Promise<void> {
    const existing = await issuePriorityRepository.findByName(projectId, name, executor);

    if (existing && existing.id !== excludePriorityId) {
      logger.warn({ projectId, name }, "Duplicate issue priority name rejected");
      throw this.error("PRIORITY_ALREADY_EXISTS", 409);
    }
  }

  private async nextLevel(projectId: string, executor: DbExecutor): Promise<number> {
    const priorities = await issuePriorityRepository.findMany(projectId, executor);

    return priorities.reduce((max, priority) => Math.max(max, priority.level), 0) + 1;
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
        await issuePriorityRepository.lockProject(tx, projectId);
        return fn(tx);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (this.isUniqueViolation(error)) {
        logger.warn({ projectId }, "Duplicate issue priority name rejected by database constraint");
        throw this.error("PRIORITY_ALREADY_EXISTS", 409);
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

  private mapPriority(priority: IssuePriorityRow): IssuePriorityResponse {
    return {
      id: priority.id,
      projectId: priority.project_id,
      name: priority.name,
      level: priority.level,
      color: priority.color,
      archived: priority.archived,
      createdAt: priority.created_at,
      updatedAt: priority.updated_at,
    };
  }

  private error(key: keyof typeof ISSUE_PRIORITY_ERRORS, statusCode: number): AppError {
    const error = ISSUE_PRIORITY_ERRORS[key];
    return new AppError(error.message, statusCode, error.code);
  }
}

export const issuePriorityService = new IssuePriorityService();
