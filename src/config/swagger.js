import swaggerJsDoc from "swagger-jsdoc";
import { serve, setup } from "swagger-ui-express";
import { PORT } from "./environment.js";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Seu Zé e Seu Mané API",
      version: "1.0.0",
      description: "API do Restaurante Seu Zé e Seu Mané",
      contact: {
        name: "Suporte",
        email: "contato@seuzeeseumane.com.br",
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: "Servidor de Desenvolvimento",
        },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default (app) => {
  app.use("/api-docs", serve, setup(swaggerDocs));
};
