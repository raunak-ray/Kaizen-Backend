import { z } from "zod";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_MIN_LENGTH,
  PROJECT_VISIBILITY,
} from "./project.constants";

const projectName = z
  .string()
  .trim()
  .min(
    PROJECT_NAME_MIN_LENGTH,
    `Project name must be at least ${PROJECT_NAME_MIN_LENGTH} characters long`,
  )
  .max(
    PROJECT_NAME_MAX_LENGTH,
    `Project name must be at most ${PROJECT_NAME_MAX_LENGTH} characters long`,
  );

const projectDescription = z
  .string()
  .trim()
  .max(
    PROJECT_DESCRIPTION_MAX_LENGTH,
    `Project description must be at most ${PROJECT_DESCRIPTION_MAX_LENGTH} characters long`,
  );

const projectVisibility = z.enum([PROJECT_VISIBILITY.PRIVATE, PROJECT_VISIBILITY.PUBLIC]);

export const createProjectSchema = z.object({
  name: projectName,
  description: projectDescription.optional(),
  visibility: projectVisibility.optional(),
});

export const updateProjectSchema = z
  .object({
    name: projectName.optional(),
    description: projectDescription.optional(),
    visibility: projectVisibility.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const projectIdSchema = z.object({
  id: z.uuid("Invalid project id"),
});
