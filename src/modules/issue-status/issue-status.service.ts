import { logger } from "@config/logger";
import { db } from "@db/client";
import { AppError } from "@/lib/errors";
import * as projectMemberRepository from "@/modules/project-members/project-member.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import type { ProjectRow } from "@/modules/projects/project.repository";
import { ISSUE_STATUS_CATEGORY, ISSUE_STATUS_ERRORS } from "./issue-status.constants";
import * as issueStatusRepository from "./issue-status.repository";
import type { DbExecutor, IssueStatusRow } from "./issue-status.repository";
import type {
  CreateIssueStatusDto,
  IssueStatusResponse,
  UpdateIssueStatusDto,
} from "./issue-status.types";

const UNIQUE_VIOLATION = "23505";

class IssueStatusService {
  async create(
    projectId: string,
    dto: CreateIssueStatusDto,
    userId: string,
  ): Promise<IssueStatusResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);

    const status = await this.runLocked(projectId, async (tx) => {
      await this.ensureUniqueName(projectId, dto.name, undefined, tx);

      const position = dto.position ?? (await this.nextPosition(projectId, tx));

      return issueStatusRepository.create(
        {
          projectId,
          name: dto.name,
          category: dto.category ?? ISSUE_STATUS_CATEGORY.TODO,
          position,
        },
        tx,
      );
    });

    logger.info({ statusId: status.id, projectId, userId }, "Issue status created");

    return this.mapStatus(status);
  }

  async findById(
    projectId: string,
    statusId: string,
    userId: string,
  ): Promise<IssueStatusResponse> {
    await this.validateMembership(projectId, userId);
    const status = await this.ensureStatusExists(projectId, statusId);

    logger.debug({ statusId, projectId, userId }, "Issue status retrieved");

    return this.mapStatus(status);
  }

  async findAll(projectId: string, userId: string): Promise<IssueStatusResponse[]> {
    await this.validateMembership(projectId, userId);

    const statuses = await issueStatusRepository.findMany(projectId);

    logger.debug({ projectId, userId, count: statuses.length }, "Issue statuses listed");

    return statuses.map((status) => this.mapStatus(status));
  }

  async update(
    projectId: string,
    statusId: string,
    dto: UpdateIssueStatusDto,
    userId: string,
  ): Promise<IssueStatusResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureStatusExists(projectId, statusId);

    const updated = await this.runLocked(projectId, async (tx) => {
      if (dto.name !== undefined) {
        await this.ensureUniqueName(projectId, dto.name, statusId, tx);
      }

      return issueStatusRepository.update(statusId, dto, tx);
    });

    if (!updated) {
      logger.warn({ statusId, projectId, userId }, "Status disappeared during update");
      throw this.error("STATUS_NOT_FOUND", 404);
    }

    logger.info({ statusId, projectId, userId, fields: Object.keys(dto) }, "Issue status updated");

    return this.mapStatus(updated);
  }

  async archive(projectId: string, statusId: string, userId: string): Promise<IssueStatusResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureStatusExists(projectId, statusId);

    const updated = await issueStatusRepository.archive(statusId);

    if (!updated) {
      logger.warn({ statusId, projectId, userId }, "Status disappeared during archive");
      throw this.error("STATUS_NOT_FOUND", 404);
    }

    logger.info({ statusId, projectId, userId }, "Issue status archived");

    return this.mapStatus(updated);
  }

  async restore(projectId: string, statusId: string, userId: string): Promise<IssueStatusResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    const status = await this.ensureStatusExists(projectId, statusId);

    if (!status.archived) {
      logger.warn({ statusId, projectId, userId }, "Restore requested for a non-archived status");
      throw this.error("STATUS_NOT_ARCHIVED", 409);
    }

    const updated = await issueStatusRepository.restore(statusId);

    if (!updated) {
      logger.warn({ statusId, projectId, userId }, "Status disappeared during restore");
      throw this.error("STATUS_NOT_FOUND", 404);
    }

    logger.info({ statusId, projectId, userId }, "Issue status restored");

    return this.mapStatus(updated);
  }

  private async validateProject(projectId: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      logger.warn({ projectId }, "Issue status action requested for a missing project");
      throw this.error("PROJECT_NOT_FOUND", 404);
    }

    return project;
  }

  private async validateMembership(projectId: string, userId: string): Promise<ProjectRow> {
    const project = await this.validateProject(projectId);

    const isMember =
      project.owner_id === userId || (await projectMemberRepository.exists(projectId, userId));

    if (!isMember) {
      logger.warn({ projectId, userId }, "Blocked issue status action from a non-member");
      throw this.error("NOT_A_MEMBER", 403);
    }

    return project;
  }

  private validateOwner(project: ProjectRow, userId: string): void {
    if (project.owner_id !== userId) {
      logger.warn(
        { projectId: project.id, userId },
        "Blocked issue status action from a non-owner",
      );
      throw this.error("NOT_PROJECT_OWNER", 403);
    }
  }

  private async ensureStatusExists(projectId: string, statusId: string): Promise<IssueStatusRow> {
    const status = await issueStatusRepository.findById(projectId, statusId);

    if (!status) {
      logger.warn({ projectId, statusId }, "Issue status not found");
      throw this.error("STATUS_NOT_FOUND", 404);
    }

    return status;
  }

  private async ensureUniqueName(
    projectId: string,
    name: string,
    excludeStatusId: string | undefined,
    executor: DbExecutor,
  ): Promise<void> {
    const existing = await issueStatusRepository.findByName(projectId, name, executor);

    if (existing && existing.id !== excludeStatusId) {
      logger.warn({ projectId, name }, "Duplicate issue status name rejected");
      throw this.error("STATUS_ALREADY_EXISTS", 409);
    }
  }

  private async nextPosition(projectId: string, executor: DbExecutor): Promise<number> {
    const statuses = await issueStatusRepository.findMany(projectId, executor);

    return statuses.reduce((max, status) => Math.max(max, status.position), 0) + 1;
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
        await issueStatusRepository.lockProject(tx, projectId);
        return fn(tx);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (this.isUniqueViolation(error)) {
        logger.warn({ projectId }, "Duplicate issue status name rejected by database constraint");
        throw this.error("STATUS_ALREADY_EXISTS", 409);
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

  private mapStatus(status: IssueStatusRow): IssueStatusResponse {
    return {
      id: status.id,
      projectId: status.project_id,
      name: status.name,
      category: status.category,
      position: status.position,
      archived: status.archived,
      createdAt: status.created_at,
      updatedAt: status.updated_at,
    };
  }

  private error(key: keyof typeof ISSUE_STATUS_ERRORS, statusCode: number): AppError {
    const error = ISSUE_STATUS_ERRORS[key];
    return new AppError(error.message, statusCode, error.code);
  }
}

export const issueStatusService = new IssueStatusService();
