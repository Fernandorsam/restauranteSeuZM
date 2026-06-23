// tests/unit/authService.test.js
import authService from "../../src/services/authService.js";
import User from "../../src/models/User.js";
import ApiError from "../../src/utils/ApiError.js";
import bcrypt from "bcryptjs";

describe("AuthService", () => {
  describe("register", () => {
    it("deve criar um novo usuário e retornar token", async () => {
      const data = { name: "João", email: "joao@test.com", password: "123456" };
      const result = await authService.register(data);

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe("João");
      expect(result.token).toBeDefined();

      // Verifica se a senha foi hashada
      const userFromDb = await User.findByEmailWithPassword("joao@test.com");
      const isMatch = await bcrypt.compare("123456", userFromDb.password);
      expect(isMatch).toBe(true);
    });

    it("deve lançar erro se e‑mail já existir", async () => {
      await User.create({
        name: "Existente",
        email: "existe@test.com",
        password: "abcd12",
        isVerified: true,
      });
      await expect(
        authService.register({
          name: "Outro",
          email: "existe@test.com",
          password: "123456",
        }),
      ).rejects.toThrow("E-mail já cadastrado");
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Cria um usuário ativo com senha conhecida
      await User.create({
        name: "Maria",
        email: "maria@test.com",
        password: "abcd12",
        isActive: true,
      });
    });

    it("deve retornar token se credenciais corretas", async () => {
      const { user, token } = await authService.login(
        "maria@test.com",
        "abcd12",
      );
      expect(user.email).toBe("maria@test.com");
      expect(token).toBeDefined();
    });

    it("deve lançar erro para senha incorreta", async () => {
      await expect(
        authService.login("maria@test.com", "errada"),
      ).rejects.toThrow("Credenciais inválidas");
    });

    it("deve lançar erro se conta desativada", async () => {
      await User.findOneAndUpdate(
        { email: "maria@test.com" },
        { isActive: false },
      );
      await expect(
        authService.login("maria@test.com", "abcd12"),
      ).rejects.toThrow("Conta desativada");
    });
  });
});
