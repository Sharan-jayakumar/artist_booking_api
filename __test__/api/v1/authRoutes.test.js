const request = require("supertest");
const app = require("../../../app");
const { User } = require("../../../app/models");

describe("Auth Routes", () => {
  describe("/api/v1/auth/register", () => {
    describe("success", () => {
      it("should successfully register a new user and store in database", async () => {
        const userData = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          confirm_password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        };
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send(userData)
          .expect("Content-Type", /json/)
          .expect(201);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body).toHaveProperty(
          "message",
          "User created successfully"
        );

        // Verify user was created in database
        const user = await User.findOne({ where: { email: userData.email } });
        expect(user).not.toBeNull();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.userType).toBe(userData.userType);
        expect(user.agreeTermsAndConditions).toBe(
          userData.agreeTermsAndConditions
        );
        // Password should be hashed, not stored as plain text
        expect(user.password).not.toBe(userData.password);
      });
    });

    describe("failure", () => {
      it("should fail when name is less than 3 characters", async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            name: "Jo",
            email: "john@example.com",
            password: "password123",
            confirm_password: "password123",
            userType: "artist",
            agreeTermsAndConditions: true,
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "name",
              message: "Name must be at least 3 characters long"
            })
          ])
        );
      });

      it("should fail when email is invalid", async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            name: "John Doe",
            email: "invalid-email",
            password: "password123",
            confirm_password: "password123",
            userType: "artist",
            agreeTermsAndConditions: true,
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "email",
              message: "Please provide a valid email"
            })
          ])
        );
      });

      it("should fail when password is less than 6 characters", async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            name: "John Doe",
            email: "john@example.com",
            password: "12345",
            confirm_password: "12345",
            userType: "artist",
            agreeTermsAndConditions: true,
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "password",
              message: "Password must be at least 6 characters long"
            })
          ])
        );
      });

      it("should fail when passwords do not match", async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            confirm_password: "password456",
            userType: "artist",
            agreeTermsAndConditions: true,
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "confirm_password",
              message: "Passwords do not match"
            })
          ])
        );
      });

      it("should fail when user type is invalid", async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            confirm_password: "password123",
            userType: "invalid",
            agreeTermsAndConditions: true,
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "userType",
              message: "User type must be either artist or venue"
            })
          ])
        );
      });

      it("should fail when terms and conditions are not accepted", async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            confirm_password: "password123",
            userType: "artist",
            agreeTermsAndConditions: false,
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "agreeTermsAndConditions",
              message: "You must agree to the terms and conditions"
            })
          ])
        );
      });

      it("should fail when email is already registered", async () => {
        // First register a user
        const userData = {
          name: "Test User",
          email: "duplicate@example.com",
          password: "password123",
          confirm_password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        };

        await request(app)
          .post("/api/v1/auth/register")
          .send(userData);

        // Try to register with the same email
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send(userData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Email already registered");
      });
    });
  });
});
