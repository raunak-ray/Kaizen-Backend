export const LABEL_NAME_MIN_LENGTH = 3;
export const LABEL_NAME_MAX_LENGTH = 255;
export const LABEL_DESCRIPTION_MAX_LENGTH = 255;
export const LABEL_COLOR_MAX_LENGTH = 7;

export const ISSUE_LABEL_ERRORS = {
  PROJECT_NOT_FOUND: {
    code: "PROJECT_NOT_FOUND",
    message: "Project not found",
  },
  NOT_PROJECT_OWNER: {
    code: "NOT_PROJECT_OWNER",
    message: "Only project owners can manage labels",
  },
  NOT_A_MEMBER: {
    code: "NOT_A_MEMBER",
    message: "You are not a member of this project",
  },
  LABEL_NOT_FOUND: {
    code: "LABEL_NOT_FOUND",
    message: "Label not found",
  },
  LABEL_ALREADY_EXISTS: {
    code: "LABEL_ALREADY_EXISTS",
    message: "Label already exists",
  },
  LABEL_NOT_ARCHIVED: {
    code: "LABEL_NOT_ARCHIVED",
    message: "Label is not archived",
  },
};
