// tests/integration/authAdmin.test.js
import request from "supertest";
// import app from "../setup.js";
import app from "../helpers/app.js";
import { getAdminToken } from "../helpers/authHelper.js";

describe("GET /api/auth/users", () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  it("deve retornar lista de usuários para admin", async () => {
    const res = await request(app)
      .get("/api/auth/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it("deve rejeitar sem token", async () => {
    const res = await request(app).get("/api/auth/users");
    expect(res.status).toBe(401);
  });

  it("deve rejeitar token de usuário comum", async () => {
    // Cria um usuário comum
    await request(app).post("/api/auth/register").send({
      name: "Comum",
      email: "comum@test.com",
      password: "123456",
      passwordConfirm: "123456",
    });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "comum@test.com", password: "123456" });
    const userToken = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/auth/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
