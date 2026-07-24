import { z } from "zod";
import {
  ISSUE_DESCRIPTION_MAX_LENGTH,
  ISSUE_LIST_DEFAULT_LIMIT,
  ISSUE_LIST_DEFAULT_PAGE,
  ISSUE_LIST_MAX_LIMIT,
  ISSUE_PRIORITY,
  ISSUE_STATUS,
  ISSUE_TITLE_MAX_LENGTH,
  ISSUE_TITLE_MIN_LENGTH,
  ISSUE_TYPES,
} from "./issue.constants";

const issueTitle = z
  .string()
  .trim()
  .min(
    ISSUE_TITLE_MIN_LENGTH,
    `Issue title must be at least ${ISSUE_TITLE_MIN_LENGTH} characters long`,
  )
  .max(
    ISSUE_TITLE_MAX_LENGTH,
    `Issue title must be at most ${ISSUE_TITLE_MAX_LENGTH} characters long`,
  );

const issueDescription = z
  .string()
  .trim()
  .max(
    ISSUE_DESCRIPTION_MAX_LENGTH,
    `Issue description must be at most ${ISSUE_DESCRIPTION_MAX_LENGTH} characters long`,
  );

const issueStatus = z.enum([ISSUE_STATUS.TODO, ISSUE_STATUS.IN_PROGRESS, ISSUE_STATUS.DONE]);
const issuePriority = z.enum([ISSUE_PRIORITY.LOW, ISSUE_PRIORITY.MEDIUM, ISSUE_PRIORITY.HIGH]);
const issueType = z.enum([ISSUE_TYPES.TASK, ISSUE_TYPES.BUG_FIX]);

export const createIssueSchema = z.object({
  title: issueTitle,
  description: issueDescription.optional(),
  assigneeId: z.uuid("Invalid assignee id").optional(),
  status: issueStatus.optional(),
  priority: issuePriority.optional(),
  type: issueType.optional(),
});

export const updateIssueSchema = z
  .object({
    title: issueTitle.optional(),
    description: issueDescription.optional(),
    type: issueType.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const assignIssueSchema = z.object({
  assigneeId: z.uuid("Invalid assignee id").nullable(),
});

export const changeStatusSchema = z.object({
  status: issueStatus,
});

export const changePrioritySchema = z.object({
  priority: issuePriority,
});

export const projectIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const issueIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  issueId: z.uuid("Invalid issue id"),
});

export const listIssuesSchema = z.object({
  status: issueStatus.optional(),
  priority: issuePriority.optional(),
  type: issueType.optional(),
  assigneeId: z.uuid("Invalid assignee id").optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  page: z.coerce.number().int().positive().optional().default(ISSUE_LIST_DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(ISSUE_LIST_MAX_LIMIT)
    .optional()
    .default(ISSUE_LIST_DEFAULT_LIMIT),
});
