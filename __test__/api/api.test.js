const db = require("../../app/models");
const request = require("supertest");
const app = require("../../app");

describe("Base API Routes", () => {
  describe("GET /api/", () => {
    it("should return welcome message", async () => {
      const response = await request(app)
        .get("/api/")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe(
        "Welcome to the Artist Booking API. Please use /api/v1/ for version 1."
      );
    });
  });

  describe("GET /api/v1", () => {
    it("should return welcome message for API V1", async () => {
      const response = await request(app)
        .get("/api/v1")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Welcome to API V1");
    });
  });

  describe("GET /xxxxx", () => {
    it("should return 404 for non-existent route", async () => {
      const response = await request(app)
        .get("/xxxxx")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body.message).toBe("Can't find /xxxxx on this server!");
      expect(response.body.status).toBe("fail");
    });
  });
});
