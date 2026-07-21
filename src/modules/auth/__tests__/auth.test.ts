import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { env } from "@config/env";
import { db } from "@db/client";
import { User } from "@db/schema";
import { createApp } from "@/app";
import { TOKEN_TYPES } from "../auth.constants";

const app = createApp();

const TEST_EMAIL_PATTERN = "auth-test-%@example.com";

async function cleanupTestUsers(): Promise<void> {
  await db.delete(User).where(like(User.email, TEST_EMAIL_PATTERN));
}

function uniqueEmail(): string {
  return `auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

const password = "StrongPass123";

async function registerUser(email: string) {
  return request(app).post("/api/auth/register").send({
    email,
    password,
    firstName: "Jane",
    lastName: "Doe",
  });
}

describe("Auth module", () => {
  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user and returns tokens", async () => {
      const email = uniqueEmail();

      const response = await registerUser(email);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email,
        firstName: "Jane",
        lastName: "Doe",
      });
      expect(response.body.data.user.password_hash).toBeUndefined();
      expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));
      expect(response.body.data.tokens.refreshToken).toEqual(expect.any(String));
    });

    it("rejects a duplicate email", async () => {
      const email = uniqueEmail();
      await registerUser(email);

      const response = await registerUser(email);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("USER_ALREADY_EXISTS");
    });

    it("rejects an invalid payload", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const email = uniqueEmail();
      await registerUser(email);

      const response = await request(app).post("/api/auth/login").send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));
    });

    it("rejects invalid credentials", async () => {
      const email = uniqueEmail();
      await registerUser(email);

      const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "WrongPass123" });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rejects a non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: uniqueEmail(), password });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("rotates a valid refresh token", async () => {
      const email = uniqueEmail();
      const { body } = await registerUser(email);
      const { refreshToken } = body.data.tokens;

      const response = await request(app).post("/api/auth/refresh").send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it("rejects a malformed refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "not-a-real-token" });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_TOKEN");
    });

    it("rejects an expired refresh token", async () => {
      const email = uniqueEmail();
      const { body } = await registerUser(email);
      const userId = body.data.user.id;

      const expiredToken = jwt.sign(
        { sub: userId, email, version: 0, type: TOKEN_TYPES.REFRESH },
        env.JWT_SECRET,
        { expiresIn: -1 },
      );

      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: expiredToken });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("TOKEN_EXPIRED");
    });

    it("rejects an access token used as a refresh token", async () => {
      const email = uniqueEmail();
      const { body } = await registerUser(email);
      const { accessToken } = body.data.tokens;

      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: accessToken });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_TOKEN_TYPE");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("invalidates existing tokens after logout", async () => {
      const email = uniqueEmail();
      const { body } = await registerUser(email);
      const { accessToken, refreshToken } = body.data.tokens;

      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(logoutResponse.status).toBe(200);

      const meResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(401);
      expect(meResponse.body.error.code).toBe("INVALID_TOKEN_VERSION");

      const refreshResponse = await request(app).post("/api/auth/refresh").send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.error.code).toBe("INVALID_TOKEN_VERSION");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the authenticated user", async () => {
      const email = uniqueEmail();
      const { body } = await registerUser(email);
      const { accessToken } = body.data.tokens;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(email);
    });

    it("rejects a request without a token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects a request with an invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer not-a-real-token");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_TOKEN");
    });

    it("rejects a deactivated account", async () => {
      const email = uniqueEmail();
      const { body } = await registerUser(email);
      const { tokens, user } = body.data;
      const { accessToken } = tokens;

      await db.update(User).set({ is_active: false }).where(eq(User.id, user.id));

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("ACCOUNT_INACTIVE");
    });
  });
});
