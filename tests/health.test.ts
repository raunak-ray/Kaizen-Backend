import request from "supertest";
import { describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import { createApp } from "../src/app.js";

const app = createApp();

describe("GET /health", () => {
  it("returns a healthy status payload", async () => {
    const response = await request(app).get(`${env.API_PREFIX}/health`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      data: {
        status: "ok",
      },
    });
    expect(response.body.data.uptime).toEqual(expect.any(String));
    expect(response.body.data.timestamp).toEqual(expect.any(String));
    expect(response.headers["x-request-id"]).toBeDefined();
  });
});
