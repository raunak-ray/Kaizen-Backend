import { logger } from "@config/logger";
import { AppError } from "@/lib/errors";
import * as authRepository from "@/modules/auth/auth.repository";
import * as projectRepository from "@/modules/projects/project.repository";
import { PROJECT_ROLES, PROJECT_MEMBER_ERRORS } from "./project-member.constants";
import * as projectMemberRepository from "./project-member.repository";
import type {
  ProjectMemberResponse,
  InviteMemberDto,
  ProjectRole,
  UpdateMemberRoleDto,
} from "./project-member.types";

class ProjectMemberService {
  async invite(
    projectId: string,
    dto: InviteMemberDto,
    requestingUserId: string,
  ): Promise<ProjectMemberResponse> {
    await this.validateOwner(projectId, requestingUserId);

    const user = await authRepository.findById(dto.userId);
    if (!user) {
      throw this.error("USER_NOT_FOUND", 404);
    }

    await this.ensureMemberDoesNotExist(projectId, dto.userId);
    const member = await projectMemberRepository.create({
      projectId,
      userId: dto.userId,
      role: dto.role ?? PROJECT_ROLES.MEMBER,
    });

    logger.info({ projectId, memberId: member.id, userId: dto.userId }, "Project member invited");
    return this.mapMember({ ...member, user });
  }

  async findAll(projectId: string): Promise<ProjectMemberResponse[]> {
    await this.validateMembership(projectId);
    const members = await projectMemberRepository.findAll(projectId);
    return members.map((member) => this.mapMember(member));
  }

  async updateRole(
    projectId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requestingUserId: string,
  ): Promise<ProjectMemberResponse> {
    const project = await this.validateOwner(projectId, requestingUserId);
    const member = await this.ensureMemberExists(projectId, memberId);

    if (member.role === PROJECT_ROLES.OWNER || member.user_id === project.owner_id) {
      throw this.error("OWNER_ROLE_CANNOT_BE_CHANGED", 409);
    }

    const updated = await projectMemberRepository.update(memberId, dto.role);
    const user = await authRepository.findById(member.user_id);

    if (!updated || !user) {
      throw this.error("MEMBER_NOT_FOUND", 404);
    }

    logger.info({ projectId, memberId, role: dto.role }, "Project member role updated");
    return this.mapMember({ ...updated, user });
  }

  async remove(projectId: string, memberId: string, requestingUserId: string): Promise<void> {
    const project = await this.validateOwner(projectId, requestingUserId);
    const member = await this.ensureMemberExists(projectId, memberId);
    this.ensureOwnerCannotBeRemoved(member.role, member.user_id === project.owner_id);

    await projectMemberRepository.deleteById(memberId);
    logger.info({ projectId, memberId }, "Project member removed");
  }

  private async validateOwner(
    projectId: string,
    userId: string,
  ): Promise<projectRepository.ProjectRow> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw this.error("PROJECT_NOT_FOUND", 404);
    }
    if (project.owner_id !== userId) {
      throw this.error("FORBIDDEN", 403);
    }
    return project;
  }

  private async validateMembership(projectId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw this.error("PROJECT_NOT_FOUND", 404);
    }
  }

  private async ensureMemberDoesNotExist(projectId: string, userId: string): Promise<void> {
    if (await projectMemberRepository.exists(projectId, userId)) {
      throw this.error("MEMBER_ALREADY_EXISTS", 409);
    }
  }

  private async ensureMemberExists(
    projectId: string,
    memberId: string,
  ): Promise<projectMemberRepository.ProjectMemberRow> {
    const member = await projectMemberRepository.findById(memberId);
    if (!member || member.project_id !== projectId) {
      throw this.error("MEMBER_NOT_FOUND", 404);
    }
    return member;
  }

  private ensureOwnerCannotBeRemoved(role: ProjectRole, isProjectOwner: boolean): void {
    if (role === PROJECT_ROLES.OWNER || isProjectOwner) {
      throw this.error("OWNER_CANNOT_BE_REMOVED", 409);
    }
  }

  private mapMember(member: projectMemberRepository.ProjectMemberWithUser): ProjectMemberResponse {
    return {
      id: member.id,
      projectId: member.project_id,
      userId: member.user_id,
      role: member.role,
      createdAt: member.created_at,
      user: {
        id: member.user.id,
        firstName: member.user.first_name,
        lastName: member.user.last_name,
        email: member.user.email,
      },
    };
  }

  private error(key: keyof typeof PROJECT_MEMBER_ERRORS, statusCode: number): AppError {
    const error = PROJECT_MEMBER_ERRORS[key];
    return new AppError(error.message, statusCode, error.code);
  }
}

export const projectMemberService = new ProjectMemberService();
