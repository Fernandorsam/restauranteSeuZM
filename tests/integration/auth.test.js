// tests/integration/auth.test.js
import request from "supertest";
// import app  from "../setup.js";
import app from "../helpers/app.js";
import User from "../../src/models/User.js";
import bycrypt from "bcryptjs";

describe("POST /api/auth/register", () => {
  it("deve registrar um novo usuário", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Teste",
      email: "teste@test.com",
      password: "123456",
      passwordConfirm: "123456",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it("deve falhar com email duplicado", async () => {
    await User.create({
      name: "Existente",
      email: "dup@test.com",
      password: "123456",
      isVerified: true,
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Dup",
      email: "dup@test.com",
      password: "123456",
      passwordConfirm: "123456",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já cadastrado/);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login",
      email: "login@test.com",
      password: "abcd1234",
      passwordConfirm: "abcd1234",
    });
  });

  it("deve retornar token com credenciais válidas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "abcd1234" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("deve retornar 401 para senha incorreta", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "errada" });
    expect(res.status).toBe(401);
  });
});
