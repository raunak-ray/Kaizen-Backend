export const DEFAULT_TYPES = [
  { name: "Task", description: "A unit of work", icon: "task" },
  { name: "Bug", description: "A defect to fix", icon: "bug" },
  { name: "Story", description: "A user-facing feature", icon: "story" },
  { name: "Epic", description: "A large body of work", icon: "epic" },
  { name: "Spike", description: "A time-boxed investigation", icon: "spike" },
  { name: "Improvement", description: "An enhancement to existing work", icon: "improvement" },
] as const;

export const TYPE_NAME_MIN_LENGTH = 3;
export const TYPE_NAME_MAX_LENGTH = 100;
export const TYPE_DESCRIPTION_MAX_LENGTH = 500;
export const TYPE_ICON_MAX_LENGTH = 50;

export const ISSUE_TYPE_ERRORS = {
  PROJECT_NOT_FOUND: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
  NOT_PROJECT_OWNER: {
    code: "NOT_PROJECT_OWNER",
    message: "Only project owners can manage issue types",
  },
  NOT_A_MEMBER: { code: "NOT_A_MEMBER", message: "You are not a member of this project" },
  TYPE_NOT_FOUND: { code: "TYPE_NOT_FOUND", message: "Type not found" },
  TYPE_ALREADY_EXISTS: { code: "TYPE_ALREADY_EXISTS", message: "Type already exists" },
  TYPE_NOT_ARCHIVED: {
    code: "TYPE_NOT_ARCHIVED",
    message: "Only archived types can be restored",
  },
} as const;
