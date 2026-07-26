import { z } from "zod";
import { PRIORITY_NAME_MAX_LENGTH, PRIORITY_NAME_MIN_LENGTH } from "./issue-priority.constants";

const priorityName = z
  .string()
  .trim()
  .min(
    PRIORITY_NAME_MIN_LENGTH,
    `Priority name must be at least ${PRIORITY_NAME_MIN_LENGTH} characters long`,
  )
  .max(
    PRIORITY_NAME_MAX_LENGTH,
    `Priority name must be at most ${PRIORITY_NAME_MAX_LENGTH} characters long`,
  );

const priorityLevel = z.coerce.number().int().min(0);

const priorityColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code, e.g. #CD1F1F");

export const createPrioritySchema = z.object({
  name: priorityName,
  level: priorityLevel.optional(),
  color: priorityColor.optional(),
});

export const updatePrioritySchema = z
  .object({
    name: priorityName.optional(),
    level: priorityLevel.optional(),
    color: priorityColor.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const projectIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const priorityIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  priorityId: z.uuid("Invalid priority id"),
});
