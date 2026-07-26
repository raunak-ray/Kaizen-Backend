import { z } from "zod";
import {
  ISSUE_STATUS_CATEGORY,
  STATUS_NAME_MAX_LENGTH,
  STATUS_NAME_MIN_LENGTH,
} from "./issue-status.constants";

const statusName = z
  .string()
  .trim()
  .min(
    STATUS_NAME_MIN_LENGTH,
    `Status name must be at least ${STATUS_NAME_MIN_LENGTH} characters long`,
  )
  .max(
    STATUS_NAME_MAX_LENGTH,
    `Status name must be at most ${STATUS_NAME_MAX_LENGTH} characters long`,
  );

const statusCategory = z.enum([
  ISSUE_STATUS_CATEGORY.TODO,
  ISSUE_STATUS_CATEGORY.IN_PROGRESS,
  ISSUE_STATUS_CATEGORY.DONE,
]);

export const createStatusSchema = z.object({
  name: statusName,
  category: statusCategory.optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export const updateStatusSchema = z
  .object({
    name: statusName.optional(),
    category: statusCategory.optional(),
    position: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const projectIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const statusIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  statusId: z.uuid("Invalid status id"),
});
