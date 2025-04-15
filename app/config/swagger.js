const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Artist Booking API",
      version: "1.0.0",
      description: "API documentation for Artist Booking service",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "API",
        description: "Base API endpoints",
      },
      {
        name: "API - V1",
        description: "Version 1 API endpoints",
      },
      {
        name: "API - V1 - Auth",
        description: "Authentication related endpoints",
      },
      {
        name: "API - V1 - Profile",
        description: "Profile management endpoints",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Error message description",
            },
            statusCode: {
              type: "integer",
              example: 400,
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation Error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    example: "error",
                  },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: {
                          type: "string",
                        },
                        message: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./app/routes/*.js", "./app/routes/v1/*.js", "./app/models/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
