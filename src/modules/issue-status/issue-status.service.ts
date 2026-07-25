import { logger } from "@config/logger";
import { AppError } from "@/lib/errors";
import * as projectMemberRepository from "@/modules/project-members/project-member.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import type { ProjectRow } from "@/modules/projects/project.repository";
import { ISSUE_STATUS_CATEGORY, ISSUE_STATUS_ERRORS } from "./issue-status.constants";
import * as issueStatusRepository from "./issue-status.repository";
import type { IssueStatusRow } from "./issue-status.repository";
import type {
  CreateIssueStatusDto,
  IssueStatusResponse,
  UpdateIssueStatusDto,
} from "./issue-status.types";

class IssueStatusService {
  async create(
    projectId: string,
    dto: CreateIssueStatusDto,
    userId: string,
  ): Promise<IssueStatusResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureUniqueName(projectId, dto.name);

    const position = dto.position ?? (await this.nextPosition(projectId));

    const status = await issueStatusRepository.create({
      projectId,
      name: dto.name,
      category: dto.category ?? ISSUE_STATUS_CATEGORY.TODO,
      position,
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

    return this.mapStatus(status);
  }

  async findAll(projectId: string, userId: string): Promise<IssueStatusResponse[]> {
    await this.validateMembership(projectId, userId);

    const statuses = await issueStatusRepository.findMany(projectId);

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

    if (dto.name !== undefined) {
      await this.ensureUniqueName(projectId, dto.name, statusId);
    }

    const updated = await issueStatusRepository.update(statusId, dto);

    logger.info({ statusId, projectId, userId, fields: Object.keys(dto) }, "Issue status updated");

    return this.mapStatus(updated as IssueStatusRow);
  }

  async archive(projectId: string, statusId: string, userId: string): Promise<IssueStatusResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureStatusExists(projectId, statusId);

    const updated = await issueStatusRepository.archive(statusId);

    logger.info({ statusId, projectId, userId }, "Issue status archived");

    return this.mapStatus(updated as IssueStatusRow);
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

    logger.info({ statusId, projectId, userId }, "Issue status restored");

    return this.mapStatus(updated as IssueStatusRow);
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
    excludeStatusId?: string,
  ): Promise<void> {
    const existing = await issueStatusRepository.findByName(projectId, name);

    if (existing && existing.id !== excludeStatusId) {
      logger.warn({ projectId, name }, "Duplicate issue status name rejected");
      throw this.error("STATUS_ALREADY_EXISTS", 409);
    }
  }

  private async nextPosition(projectId: string): Promise<number> {
    const statuses = await issueStatusRepository.findMany(projectId);

    return statuses.reduce((max, status) => Math.max(max, status.position), 0) + 1;
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
