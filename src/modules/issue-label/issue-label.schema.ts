import { z } from "zod";
import {
  LABEL_COLOR_MAX_LENGTH,
  LABEL_DESCRIPTION_MAX_LENGTH,
  LABEL_NAME_MAX_LENGTH,
  LABEL_NAME_MIN_LENGTH,
} from "./issue-label.constants";

const labelName = z
  .string()
  .trim()
  .min(
    LABEL_NAME_MIN_LENGTH,
    `Label name must be at least ${LABEL_NAME_MIN_LENGTH} characters long`,
  )
  .max(
    LABEL_NAME_MAX_LENGTH,
    `Label name must be at most ${LABEL_NAME_MAX_LENGTH} characters long`,
  );

const labelColor = z
  .string()
  .trim()
  .max(LABEL_COLOR_MAX_LENGTH, `Color must be at most ${LABEL_COLOR_MAX_LENGTH} characters long`)
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #RRGGBB");

const labelDescription = z
  .string()
  .trim()
  .max(
    LABEL_DESCRIPTION_MAX_LENGTH,
    `Description must be at most ${LABEL_DESCRIPTION_MAX_LENGTH} characters long`,
  );

export const createLabelSchema = z.object({
  name: labelName,
  color: labelColor,
  description: labelDescription.optional(),
});

export const updateLabelSchema = z
  .object({
    name: labelName.optional(),
    color: labelColor.optional(),
    description: labelDescription.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const projectIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const labelIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  labelId: z.uuid("Invalid label id"),
});
