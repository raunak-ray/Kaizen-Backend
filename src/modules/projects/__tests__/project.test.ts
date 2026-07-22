import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { inArray, like } from "drizzle-orm";
import { db } from "@db/client";
import { Project, User } from "@db/schema";
import { createApp } from "@/app";

const app = createApp();

const TEST_EMAIL_PATTERN = "project-test-%@example.com";
const password = "StrongPass123";

async function cleanupTestData(): Promise<void> {
  const testUsers = await db
    .select({ id: User.id })
    .from(User)
    .where(like(User.email, TEST_EMAIL_PATTERN));

  const userIds = testUsers.map((user) => user.id);

  if (userIds.length > 0) {
    await db.delete(Project).where(inArray(Project.owner_id, userIds));
  }

  await db.delete(User).where(like(User.email, TEST_EMAIL_PATTERN));
}

function uniqueEmail(): string {
  return `project-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function registerUser(): Promise<{ accessToken: string; userId: string }> {
  const email = uniqueEmail();

  const response = await request(app).post("/api/auth/register").send({
    email,
    password,
    firstName: "Jane",
    lastName: "Doe",
  });

  return {
    accessToken: response.body.data.tokens.accessToken as string,
    userId: response.body.data.user.id as string,
  };
}

function createProject(accessToken: string, body: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name: "Project Phoenix", ...body });
}

describe("Projects module", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("POST /api/projects", () => {
    it("creates a project owned by the authenticated user", async () => {
      const { accessToken, userId } = await registerUser();

      const response = await createProject(accessToken, {
        name: "Project Phoenix",
        description: "Rebuilding the checkout flow.",
        visibility: "public",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: "Project Phoenix",
        description: "Rebuilding the checkout flow.",
        ownerId: userId,
        visibility: "public",
        isArchived: false,
      });
      expect(response.body.data.key).toEqual(expect.any(String));
      expect(response.body.data.key.length).toBeGreaterThanOrEqual(2);
    });

    it("defaults to private visibility when not specified", async () => {
      const { accessToken } = await registerUser();

      const response = await createProject(accessToken);

      expect(response.status).toBe(201);
      expect(response.body.data.visibility).toBe("private");
    });

    it("generates a unique key by appending a numeric suffix on collision", async () => {
      const { accessToken } = await registerUser();

      const first = await createProject(accessToken, { name: "API" });
      const second = await createProject(accessToken, { name: "API" });

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(first.body.data.key).toBe("API");
      expect(second.body.data.key).toBe("API1");
    });

    it("rejects a project name that is too short", async () => {
      const { accessToken } = await registerUser();

      const response = await createProject(accessToken, { name: "AB" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a request without an access token", async () => {
      const response = await request(app).post("/api/projects").send({ name: "Project Phoenix" });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/projects/:id", () => {
    it("returns the project for its owner", async () => {
      const { accessToken } = await registerUser();
      const { body } = await createProject(accessToken);
      const projectId = body.data.id;

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(projectId);
    });

    it("returns 404 for a missing project", async () => {
      const { accessToken } = await registerUser();

      const response = await request(app)
        .get("/api/projects/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    });

    it("returns 404 for another user's private project", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { body } = await createProject(owner.accessToken, { visibility: "private" });

      const response = await request(app)
        .get(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${other.accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    });
  });

  describe("GET /api/projects", () => {
    it("lists public projects and the user's own private projects", async () => {
      const owner = await registerUser();
      const other = await registerUser();

      await createProject(owner.accessToken, { name: "Owner Private", visibility: "private" });
      await createProject(owner.accessToken, { name: "Owner Public", visibility: "public" });
      await createProject(other.accessToken, { name: "Other Private", visibility: "private" });

      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${owner.accessToken}`);

      expect(response.status).toBe(200);
      const names = response.body.data.map((project: { name: string }) => project.name);
      expect(names).toContain("Owner Private");
      expect(names).toContain("Owner Public");
      expect(names).not.toContain("Other Private");
    });
  });

  describe("PATCH /api/projects/:id", () => {
    it("updates a project owned by the authenticated user", async () => {
      const { accessToken } = await registerUser();
      const { body } = await createProject(accessToken);

      const response = await request(app)
        .patch(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Renamed Project" });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Renamed Project");
    });

    it("rejects an update from a non-owner", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { body } = await createProject(owner.accessToken);

      const response = await request(app)
        .patch(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${other.accessToken}`)
        .send({ name: "Hijacked Project" });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects an update to an archived project", async () => {
      const { accessToken } = await registerUser();
      const { body } = await createProject(accessToken);

      await request(app)
        .patch(`/api/projects/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${accessToken}`);

      const response = await request(app)
        .patch(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Renamed Project" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("PROJECT_ARCHIVED");
    });
  });

  describe("PATCH /api/projects/:id/archive", () => {
    it("archives a project owned by the authenticated user", async () => {
      const { accessToken } = await registerUser();
      const { body } = await createProject(accessToken);

      const response = await request(app)
        .patch(`/api/projects/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isArchived).toBe(true);
    });

    it("rejects archiving from a non-owner", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { body } = await createProject(owner.accessToken);

      const response = await request(app)
        .patch(`/api/projects/${body.data.id}/archive`)
        .set("Authorization", `Bearer ${other.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("deletes a project owned by the authenticated user", async () => {
      const { accessToken } = await registerUser();
      const { body } = await createProject(accessToken);

      const response = await request(app)
        .delete(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app)
        .get(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("rejects deletion from a non-owner", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const { body } = await createProject(owner.accessToken);

      const response = await request(app)
        .delete(`/api/projects/${body.data.id}`)
        .set("Authorization", `Bearer ${other.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects a request without an access token", async () => {
      const { accessToken } = await registerUser();
      const { body } = await createProject(accessToken);

      const response = await request(app).delete(`/api/projects/${body.data.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
