// tests/integration/reservation.test.js
import { jest } from "@jest/globals";
import request from "supertest";
// import app from "../setup.js";
import app from "../helpers/app.js";
import { getAdminToken } from "../helpers/authHelper.js";
import Reservation from "../../src/models/reservation.js";
import emailService from "../../src/services/emailService.js";

jest.mock("../../src/services/emailService.js");

describe("Reservas", () => {
  let userToken, adminToken;

  beforeAll(async () => {
    // Registra um cliente
    await request(app).post("/api/auth/register").send({
      name: "Cliente",
      email: "cliente@test.com",
      password: "123456",
      passwordConfirm: "123456",
    });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "cliente@test.com", password: "123456" });
    userToken = loginRes.body.data.token;
    adminToken = await getAdminToken();
  });

  it("deve criar uma reserva", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        customer: {
          name: "Cliente",
          email: "cliente@test.com",
          phone: "(61) 91234-5678",
        },
        reservationDetails: {
          date: new Date(Date.now() + 86400000).toISOString(), // amanhã
          time: "19:00",
          guests: 2,
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.data.reservation.status).toBe("pending");
    // Verifica se o mock de envio de e‑mail foi chamado
    expect(emailService.sendReservationConfirmation).toHaveBeenCalled();
  });

  it("deve verificar disponibilidade", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app).get(
      `/api/reservations/availability?date=${futureDate}&time=19:00&guests=2`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBeDefined();
  });

  it("deve confirmar reserva como admin", async () => {
    const reservation = await Reservation.create({
      customer: {
        name: "Cliente",
        email: "cliente@test.com",
        phone: "(61) 91234-5678",
      },
      reservationDetails: {
        date: new Date(Date.now() + 86400000),
        time: "19:00",
        guests: 2,
      },
      status: "pending",
    });

    const res = await request(app)
      .patch(`/api/reservations/${reservation._id}/confirm`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const updated = await Reservation.findById(reservation._id);
    expect(updated.status).toBe("confirmed");
  });
});
