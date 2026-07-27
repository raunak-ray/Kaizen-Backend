import { logger } from "@config/logger";
import { AppError } from "@/lib/errors";
import * as projectMemberRepository from "@/modules/project-members/project-member.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import type { ProjectRow } from "@/modules/projects/project.repository";
import { ISSUE_LABEL_ERRORS } from "./issue-label.constants";
import * as issueLabelRepository from "./issue-label.repository";
import type { IssueLabelRow } from "./issue-label.repository";
import type {
  CreateIssueLabelDto,
  IssueLabelResponse,
  UpdateIssueLabelDto,
} from "./issue-label.types";

class IssueLabelService {
  async create(
    projectId: string,
    dto: CreateIssueLabelDto,
    userId: string,
  ): Promise<IssueLabelResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureUniqueName(projectId, dto.name);

    const label = await issueLabelRepository.create({
      projectId,
      name: dto.name,
      color: dto.color,
      description: dto.description,
    });

    logger.info({ labelId: label.id, projectId, userId }, "Issue label created");

    return this.mapLabel(label);
  }

  async findById(projectId: string, labelId: string, userId: string): Promise<IssueLabelResponse> {
    await this.validateMembership(projectId, userId);
    const label = await this.ensureLabelExists(projectId, labelId);

    logger.debug({ labelId, projectId, userId }, "Issue label retrieved");

    return this.mapLabel(label);
  }

  async findAll(projectId: string, userId: string): Promise<IssueLabelResponse[]> {
    await this.validateMembership(projectId, userId);

    const labels = await issueLabelRepository.findMany(projectId);

    logger.debug({ projectId, userId, count: labels.length }, "Issue labels listed");

    return labels.map((label) => this.mapLabel(label));
  }

  async update(
    projectId: string,
    labelId: string,
    dto: UpdateIssueLabelDto,
    userId: string,
  ): Promise<IssueLabelResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureLabelExists(projectId, labelId);

    if (dto.name !== undefined) {
      await this.ensureUniqueName(projectId, dto.name, labelId);
    }

    const updated = await issueLabelRepository.update(labelId, dto);

    if (!updated) {
      logger.warn({ labelId, projectId, userId }, "Label disappeared during update");
      throw this.error("LABEL_NOT_FOUND", 404);
    }

    logger.info({ labelId, projectId, userId, fields: Object.keys(dto) }, "Issue label updated");

    return this.mapLabel(updated);
  }

  async archive(projectId: string, labelId: string, userId: string): Promise<IssueLabelResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    await this.ensureLabelExists(projectId, labelId);

    const updated = await issueLabelRepository.archive(labelId);

    if (!updated) {
      logger.warn({ labelId, projectId, userId }, "Label disappeared during archive");
      throw this.error("LABEL_NOT_FOUND", 404);
    }

    logger.info({ labelId, projectId, userId }, "Issue label archived");

    return this.mapLabel(updated);
  }

  async restore(projectId: string, labelId: string, userId: string): Promise<IssueLabelResponse> {
    const project = await this.validateProject(projectId);
    this.validateOwner(project, userId);
    const label = await this.ensureLabelExists(projectId, labelId);

    if (!label.archived) {
      logger.warn({ labelId, projectId, userId }, "Restore requested for a non-archived label");
      throw this.error("LABEL_NOT_ARCHIVED", 409);
    }

    const updated = await issueLabelRepository.restore(labelId);

    if (!updated) {
      logger.warn({ labelId, projectId, userId }, "Label disappeared during restore");
      throw this.error("LABEL_NOT_FOUND", 404);
    }

    logger.info({ labelId, projectId, userId }, "Issue label restored");

    return this.mapLabel(updated);
  }

  private async validateProject(projectId: string): Promise<ProjectRow> {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      logger.warn({ projectId }, "Issue label action requested for a missing project");
      throw this.error("PROJECT_NOT_FOUND", 404);
    }

    return project;
  }

  private async validateMembership(projectId: string, userId: string): Promise<ProjectRow> {
    const project = await this.validateProject(projectId);

    const isMember =
      project.owner_id === userId || (await projectMemberRepository.exists(projectId, userId));

    if (!isMember) {
      logger.warn({ projectId, userId }, "Blocked issue label action from a non-member");
      throw this.error("NOT_A_MEMBER", 403);
    }

    return project;
  }

  private validateOwner(project: ProjectRow, userId: string): void {
    if (project.owner_id !== userId) {
      logger.warn({ projectId: project.id, userId }, "Blocked issue label action from a non-owner");
      throw this.error("NOT_PROJECT_OWNER", 403);
    }
  }

  private async ensureLabelExists(projectId: string, labelId: string): Promise<IssueLabelRow> {
    const label = await issueLabelRepository.findById(projectId, labelId);

    if (!label) {
      logger.warn({ projectId, labelId }, "Issue label not found");
      throw this.error("LABEL_NOT_FOUND", 404);
    }

    return label;
  }

  private async ensureUniqueName(
    projectId: string,
    name: string,
    excludeLabelId?: string,
  ): Promise<void> {
    const existing = await issueLabelRepository.findByName(projectId, name);

    if (existing && existing.id !== excludeLabelId) {
      logger.warn({ projectId, name }, "Duplicate issue label name rejected");
      throw this.error("LABEL_ALREADY_EXISTS", 409);
    }
  }

  private mapLabel(label: IssueLabelRow): IssueLabelResponse {
    return {
      id: label.id,
      projectId: label.project_id,
      name: label.name,
      color: label.color,
      description: label.description,
      archived: label.archived,
      createdAt: label.created_at,
      updatedAt: label.updated_at,
    };
  }

  private error(key: keyof typeof ISSUE_LABEL_ERRORS, statusCode: number): AppError {
    const error = ISSUE_LABEL_ERRORS[key];
    return new AppError(error.message, statusCode, error.code);
  }
}

export const issueLabelService = new IssueLabelService();
