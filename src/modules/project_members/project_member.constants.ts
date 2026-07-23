export const PROJECT_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export const PROJECT_MEMBER_ERRORS = {
  MEMBER_ALREADY_EXISTS: {
    code: "MEMBER_ALREADY_EXISTS",
    message: "User is already a member of this project",
  },

  MEMBER_NOT_FOUND: {
    code: "MEMBER_NOT_FOUND",
    message: "Member not found",
  },

  OWNER_CANNOT_BE_REMOVED: {
    code: "OWNER_CANNOT_BE_REMOVED",
    message: "Owner cannot be removed from the project",
  },

  OWNER_ROLE_CANNOT_BE_CHANGED: {
    code: "OWNER_ROLE_CANNOT_BE_CHANGED",
    message: "Owner role cannot be changed",
  },

  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User not found",
  },

  PROJECT_NOT_FOUND: {
    code: "PROJECT_NOT_FOUND",
    message: "Project not found",
  },

  FORBIDDEN: {
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action",
  },
} as const;
