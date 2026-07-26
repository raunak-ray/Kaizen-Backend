export const DEFAULT_PRIORITIES = [
  { name: "Highest", level: 1, color: "#CD1F1F" },
  { name: "High", level: 2, color: "#E97F33" },
  { name: "Medium", level: 3, color: "#E2B203" },
  { name: "Low", level: 4, color: "#2D8738" },
  { name: "Lowest", level: 5, color: "#4C9AFF" },
] as const;

export const DEFAULT_PRIORITY_COLOR = "#6B7280";

export const PRIORITY_NAME_MIN_LENGTH = 3;
export const PRIORITY_NAME_MAX_LENGTH = 100;

export const ISSUE_PRIORITY_ERRORS = {
  PROJECT_NOT_FOUND: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
  NOT_PROJECT_OWNER: {
    code: "NOT_PROJECT_OWNER",
    message: "Only project owners can manage priorities",
  },
  NOT_A_MEMBER: { code: "NOT_A_MEMBER", message: "You are not a member of this project" },
  PRIORITY_NOT_FOUND: { code: "PRIORITY_NOT_FOUND", message: "Priority not found" },
  PRIORITY_ALREADY_EXISTS: {
    code: "PRIORITY_ALREADY_EXISTS",
    message: "Priority already exists",
  },
  PRIORITY_NOT_ARCHIVED: {
    code: "PRIORITY_NOT_ARCHIVED",
    message: "Only archived priorities can be restored",
  },
} as const;
