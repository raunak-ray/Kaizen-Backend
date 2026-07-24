import { logger } from "@config/logger";
import { AppError } from "@/lib/errors";
import * as authRepository from "@/modules/auth/auth.repository";
import * as projectMemberRepository from "@/modules/project-members/project-member.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import type { ProjectRow } from "@/modules/projects/project.repository";
import { ISSUE_ERRORS, ISSUE_PRIORITY, ISSUE_STATUS, ISSUE_TYPES } from "./issue.constants";
import * as issueRepository from "./issue.repository";
import type { IssueRow } from "./issue.repository";
import type {
  AssignIssueDto,
  ChangePriorityDto,
  ChangeStatusDto,
  CreateIssueDto,
  IssueListResponse,
  IssueResponse,
  ListIssuesQuery,
  UpdateIssueDto,
} from "./issue.types";

class IssueService {
  async create(projectId: string, dto: CreateIssueDto, userId: string): Promise<IssueResponse> {
    const project = await this.validateMembership(projectId, userId);

    if (dto.assigneeId) {
      await this.validateAssignee(project, dto.assigneeId);
    }

    const issue = await issueRepository.create({
      projectId,
      reporterId: userId,
      assigneeId: dto.assigneeId,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? ISSUE_STATUS.TODO,
      priority: dto.priority ?? ISSUE_PRIORITY.MEDIUM,
      type: dto.type ?? ISSUE_TYPES.TASK,
    });

    logger.info({ issueId: issue.id, projectId, reporterId: userId }, "Issue created");

    return this.mapIssue(issue);
  }

  async findById(projectId: string, issueId: string, userId: string): Promise<IssueResponse> {
    await this.validateMembership(projectId, userId);
    const issue = await this.ensureIssueExists(projectId, issueId);

    logger.debug({ issueId, projectId, userId }, "Issue retrieved");

    return this.mapIssue(issue);
  }

  async findAll(
    projectId: string,
    query: ListIssuesQuery,
    userId: string,
  ): Promise<IssueListResponse> {
    await this.validateMembership(projectId, userId);

    const { items, total } = await issueRepository.findMany(projectId, query);

    logger.debug({ projectId, userId, count: items.length, total }, "Issues listed");

    return {
      issues: items.map((issue) => this.mapIssue(issue)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async update(
    projectId: string,
    issueId: string,
    dto: UpdateIssueDto,
    userId: string,
  ): Promise<IssueResponse> {
    await this.validateMembership(projectId, userId);
    const issue = await this.ensureIssueExists(projectId, issueId);
    this.ensureIssueIsActive(issue);

    const updated = await issueRepository.update(issueId, dto);

    logger.info({ issueId, projectId, userId, fields: Object.keys(dto) }, "Issue updated");

    return this.mapIssue(updated as IssueRow);
  }

  async assign(
    projectId: string,
    issueId: string,
    dto: AssignIssueDto,
    userId: string,
  ): Promise<IssueResponse> {
    const project = await this.validateMembership(projectId, userId);
    const issue = await this.ensureIssueExists(projectId, issueId);
    this.ensureIssueIsActive(issue);

    if (dto.assigneeId) {
      await this.validateAssignee(project, dto.assigneeId);
    }

    const updated = await issueRepository.update(issueId, { assigneeId: dto.assigneeId });

    logger.info(
      { issueId, projectId, userId, assigneeId: dto.assigneeId },
      "Issue assignment updated",
    );

    return this.mapIssue(updated as IssueRow);
  }

  async changeStatus(
    projectId: string,
    issueId: string,
    dto: ChangeStatusDto,
    userId: string,
  ): Promise<IssueResponse> {
    await this.validateMembership(projectId, userId);
    const issue = await this.ensureIssueExists(projectId, issueId);
    this.ensureIssueIsActive(issue);

    const updated = await issueRepository.update(issueId, { status: dto.status });

    logger.info({ issueId, projectId, userId, status: dto.status }, "Issue status changed");

    return this.mapIssue(updated as IssueRow);
  }

  async changePriority(
    projectId: string,
    issueId: string,
    dto: ChangePriorityDto,
    userId: string,
  ): Promise<IssueResponse> {
    await this.validateMembership(projectId, userId);
    const issue = await this.ensureIssueExists(projectId, issueId);
    this.ensureIssueIsActive(issue);

    const updated = await issueRepository.update(issueId, { priority: dto.priority });

    logger.info({ issueId, projectId, userId, priority: dto.priority }, "Issue priority changed");

    return this.mapIssue(updated as IssueRow);
  }

  async archive(projectId: string, issueId: string, userId: string): Promise<IssueResponse> {
    await this.validateMembership(projectId, userId);
    await this.ensureIssueExists(projectId, issueId);

    const updated = await issueRepository.archive(issueId);

    logger.info({ issueId, projectId, userId }, "Issue archived");

    return this.mapIssue(updated as IssueRow);
  }

  async restore(projectId: string, issueId: string, userId: string): Promise<IssueResponse> {
    await this.validateMembership(projectId, userId);
    const issue = await this.ensureIssueExists(projectId, issueId);

    if (!issue.archived) {
      logger.warn({ issueId, projectId, userId }, "Restore requested for a non-archived issue");
      throw this.error("ISSUE_NOT_ARCHIVED", 409);
    }

    const updated = await issueRepository.restore(issueId);

    logger.info({ issueId, projectId, userId }, "Issue restored");

    return this.mapIssue(updated as IssueRow);
  }

  async remove(projectId: string, issueId: string, userId: string): Promise<void> {
    await this.validateMembership(projectId, userId);
    await this.ensureIssueExists(projectId, issueId);

    await issueRepository.softDelete(issueId);

    logger.info({ issueId, projectId, userId }, "Issue deleted");
  }

  private async validateProject(projectId: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      logger.warn({ projectId }, "Issue action requested for a missing project");
      throw this.error("PROJECT_NOT_FOUND", 404);
    }

    return project;
  }

  private async validateMembership(projectId: string, userId: string): Promise<ProjectRow> {
    const project = await this.validateProject(projectId);

    const isMember =
      project.owner_id === userId || (await projectMemberRepository.exists(projectId, userId));

    if (!isMember) {
      logger.warn({ projectId, userId }, "Blocked issue action from a non-member");
      throw this.error("NOT_A_MEMBER", 403);
    }

    return project;
  }

  private async validateAssignee(project: ProjectRow, assigneeId: string): Promise<void> {
    const user = await authRepository.findById(assigneeId);

    if (!user) {
      logger.warn({ projectId: project.id, assigneeId }, "Cannot assign issue to unknown user");
      throw this.error("ASSIGNEE_NOT_FOUND", 404);
    }

    const isMember =
      project.owner_id === assigneeId ||
      (await projectMemberRepository.exists(project.id, assigneeId));

    if (!isMember) {
      logger.warn({ projectId: project.id, assigneeId }, "Cannot assign issue to a non-member");
      throw this.error("ASSIGNEE_NOT_A_MEMBER", 400);
    }
  }

  private async ensureIssueExists(projectId: string, issueId: string): Promise<IssueRow> {
    const issue = await issueRepository.findById(projectId, issueId);

    if (!issue) {
      logger.warn({ projectId, issueId }, "Issue not found");
      throw this.error("ISSUE_NOT_FOUND", 404);
    }

    return issue;
  }

  private ensureIssueIsActive(issue: IssueRow): void {
    if (issue.archived) {
      logger.warn({ issueId: issue.id }, "Blocked modification of an archived issue");
      throw this.error("ISSUE_ARCHIVED", 409);
    }
  }

  private mapIssue(issue: IssueRow): IssueResponse {
    return {
      id: issue.id,
      projectId: issue.project_id,
      reporterId: issue.reporter_id,
      assigneeId: issue.assignee_id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      type: issue.type,
      archived: issue.archived,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    };
  }

  private error(key: keyof typeof ISSUE_ERRORS, statusCode: number): AppError {
    const error = ISSUE_ERRORS[key];
    return new AppError(error.message, statusCode, error.code);
  }
}

export const issueService = new IssueService();
