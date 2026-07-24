import type { ISSUE_PRIORITY, ISSUE_STATUS, ISSUE_TYPES } from "./issue.constants";

export type IssueStatus = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS];
export type IssuePriority = (typeof ISSUE_PRIORITY)[keyof typeof ISSUE_PRIORITY];
export type IssueType = (typeof ISSUE_TYPES)[keyof typeof ISSUE_TYPES];

export interface CreateIssueDto {
  title: string;
  description?: string;
  assigneeId?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  type?: IssueType;
}

export interface AssignIssueDto {
  assigneeId: string | null;
}

export interface ChangeStatusDto {
  status: IssueStatus;
}

export interface ChangePriorityDto {
  priority: IssuePriority;
}

export interface ListIssuesQuery {
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  archived?: boolean;
  page: number;
  limit: number;
}

export interface IssueResponse {
  id: string;
  projectId: string;
  reporterId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueListResponse {
  issues: IssueResponse[];
  total: number;
  page: number;
  limit: number;
}
