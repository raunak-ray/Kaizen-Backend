import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env.js";

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Kaizen API",
    version: "1.0.0",
    description: "API documentation for the Kaizen backend",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: "Local server",
    },
  ],
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts", "./src/modules/**/*.ts"],
});
