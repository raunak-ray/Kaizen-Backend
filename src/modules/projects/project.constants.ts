export const PROJECT_NAME_MIN_LENGTH = 3;
export const PROJECT_NAME_MAX_LENGTH = 100;

export const PROJECT_DESCRIPTION_MAX_LENGTH = 2000;

export const PROJECT_KEY_MIN_LENGTH = 2;
export const PROJECT_KEY_MAX_LENGTH = 10;

// Uppercase letters only, 2-10 characters.
export const PROJECT_KEY_REGEX = /^[A-Z]{2,10}$/;

// Number of leading letters taken from the project name to build the base key.
export const PROJECT_KEY_BASE_LENGTH = 4;

// Used when a project name has fewer than PROJECT_KEY_MIN_LENGTH letters.
export const PROJECT_KEY_FALLBACK = "PRJ";

// Safety cap on numeric-suffix attempts while resolving a key collision.
export const PROJECT_KEY_MAX_SUFFIX_ATTEMPTS = 1000;

export const PROJECT_VISIBILITY = {
  PRIVATE: "private",
  PUBLIC: "public",
} as const;

export const PROJECT_ERRORS = {
  PROJECT_NOT_FOUND: {
    code: "PROJECT_NOT_FOUND",
    message: "Project not found",
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action on this project",
  },
  PROJECT_ARCHIVED: {
    code: "PROJECT_ARCHIVED",
    message: "Archived projects cannot be updated",
  },
  KEY_GENERATION_FAILED: {
    code: "KEY_GENERATION_FAILED",
    message: "Failed to generate a unique project key",
  },
} as const;
