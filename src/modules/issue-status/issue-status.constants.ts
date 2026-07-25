export const ISSUE_STATUS_CATEGORY = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
} as const;

export const DEFAULT_STATUSES: { name: string; category: string; position: number }[] = [
  { name: "Todo", category: ISSUE_STATUS_CATEGORY.TODO, position: 1 },
  { name: "In Progress", category: ISSUE_STATUS_CATEGORY.IN_PROGRESS, position: 2 },
  { name: "Review", category: ISSUE_STATUS_CATEGORY.IN_PROGRESS, position: 3 },
  { name: "Done", category: ISSUE_STATUS_CATEGORY.DONE, position: 4 },
] as const;

export const STATUS_NAME_MIN_LENGTH = 3;
export const STATUS_NAME_MAX_LENGTH = 100;

export const ISSUE_STATUS_ERRORS = {
  PROJECT_NOT_FOUND: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
  NOT_PROJECT_OWNER: {
    code: "NOT_PROJECT_OWNER",
    message: "Only project owners can create custom statuses",
  },
  NOT_A_MEMBER: { code: "NOT_A_MEMBER", message: "You are not a member of this project" },
  STATUS_NOT_FOUND: { code: "STATUS_NOT_FOUND", message: "Status not found" },
  STATUS_ALREADY_EXISTS: { code: "STATUS_ALREADY_EXISTS", message: "Status already exists" },
  STATUS_NOT_ARCHIVED: {
    code: "STATUS_NOT_ARCHIVED",
    message: "Only archived statuses can be restored",
  },
  CANNOT_ARCHIVE_DEFAULT_STATUS: {
    code: "CANNOT_ARCHIVE_DEFAULT_STATUS",
    message: "Default statuses cannot be archived",
  },
} as const;
