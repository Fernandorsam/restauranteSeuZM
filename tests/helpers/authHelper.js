// // tests/helpers/authHelper.js
// import request from "supertest";
// import app from "../setup.js";

// export default {
//   getAdminToken: async function() {
//     // Garante que existe um admin
//     const admin = await User.findOne({ email: "admin@test.com" });
//   if (!admin) {
//     await request(app)
//       .post("/api/auth/register")
//       .send({
//         name: "Admin",
//         email: "admin@test.com",
//         password: "admin123",
//         passwordConfirm: "admin123",
//       });
//     await User.findOneAndUpdate(
//       { email: "admin@test.com" },
//       { role: "admin", isVerified: true },
//     );
//   }
//   const res = await request(app)
//     .post("/api/auth/login")
//     .send({ email: "admin@test.com", password: "admin123" });
//   return res.body.data.token;
// }
// }


import request from "supertest";
import app from "../integration/setup.js"; // ← setup correto
import User from "../../src/models/User.js"; // ← import necessário

// Named export para bater com o import em authAdmin.test.js e reservation.test.js
export async function getAdminToken() {
  const admin = await User.findOne({ email: "admin@test.com" });
  if (!admin) {
    await request(app).post("/api/auth/register").send({
      name: "Admin",
      email: "admin@test.com",
      password: "admin123",
      passwordConfirm: "admin123",
    });
    await User.findOneAndUpdate(
      { email: "admin@test.com" },
      { role: "admin", isVerified: true }
    );
  }
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@test.com", password: "admin123" });
  return res.body.data.token;
}