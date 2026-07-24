export const ISSUE_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
} as const;

export const ISSUE_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const ISSUE_TYPES = {
  TASK: "task",
  BUG_FIX: "bug-fix",
} as const;

export const ISSUE_TITLE_MIN_LENGTH = 3;
export const ISSUE_TITLE_MAX_LENGTH = 255;
export const ISSUE_DESCRIPTION_MAX_LENGTH = 2000;

export const ISSUE_LIST_DEFAULT_PAGE = 1;
export const ISSUE_LIST_DEFAULT_LIMIT = 20;
export const ISSUE_LIST_MAX_LIMIT = 100;

export const ISSUE_ERRORS = {
  PROJECT_NOT_FOUND: {
    code: "PROJECT_NOT_FOUND",
    message: "Project not found",
  },
  ISSUE_NOT_FOUND: {
    code: "ISSUE_NOT_FOUND",
    message: "Issue not found",
  },
  ASSIGNEE_NOT_FOUND: {
    code: "ASSIGNEE_NOT_FOUND",
    message: "Assignee not found",
  },
  ASSIGNEE_NOT_A_MEMBER: {
    code: "ASSIGNEE_NOT_A_MEMBER",
    message: "Assignee is not a member of this project",
  },
  NOT_A_MEMBER: {
    code: "NOT_A_MEMBER",
    message: "You are not a member of this project",
  },
  ISSUE_ARCHIVED: {
    code: "ISSUE_ARCHIVED",
    message: "Archived issues cannot be modified",
  },
  ISSUE_NOT_ARCHIVED: {
    code: "ISSUE_NOT_ARCHIVED",
    message: "Only archived issues can be restored",
  },
} as const;
