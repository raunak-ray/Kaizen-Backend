import { z } from "zod";
import {
  TYPE_DESCRIPTION_MAX_LENGTH,
  TYPE_ICON_MAX_LENGTH,
  TYPE_NAME_MAX_LENGTH,
  TYPE_NAME_MIN_LENGTH,
} from "./issue-type.constants";

const typeName = z
  .string()
  .trim()
  .min(TYPE_NAME_MIN_LENGTH, `Type name must be at least ${TYPE_NAME_MIN_LENGTH} characters long`)
  .max(TYPE_NAME_MAX_LENGTH, `Type name must be at most ${TYPE_NAME_MAX_LENGTH} characters long`);

const typeDescription = z
  .string()
  .trim()
  .max(
    TYPE_DESCRIPTION_MAX_LENGTH,
    `Description must be at most ${TYPE_DESCRIPTION_MAX_LENGTH} characters long`,
  );

const typeIcon = z
  .string()
  .trim()
  .max(TYPE_ICON_MAX_LENGTH, `Icon must be at most ${TYPE_ICON_MAX_LENGTH} characters long`);

export const createTypeSchema = z.object({
  name: typeName,
  description: typeDescription.optional(),
  icon: typeIcon.optional(),
});

export const updateTypeSchema = z
  .object({
    name: typeName.optional(),
    description: typeDescription.optional(),
    icon: typeIcon.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const projectIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const typeIdSchema = z.object({
  projectId: z.uuid("Invalid project id"),
  typeId: z.uuid("Invalid type id"),
});
