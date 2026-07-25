import { ISSUE_STATUS_CATEGORY } from "./issue-status.constants";

export type IssueStatusCategory =
  (typeof ISSUE_STATUS_CATEGORY)[keyof typeof ISSUE_STATUS_CATEGORY];

export interface CreateIssueStatusDto {
  name: string;
  category?: IssueStatusCategory;
  position?: number;
}

export interface UpdateIssueStatusDto {
  name?: string;
  category?: IssueStatusCategory;
  position?: number;
}

export interface IssueStatusResponse {
  id: string;
  projectId: string;
  name: string;
  category: IssueStatusCategory;
  position: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
