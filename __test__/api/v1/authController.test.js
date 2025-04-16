const request = require("supertest");
const app = require("../../../app");
const { User } = require("../../../app/models");
const sequelizeFixtures = require("sequelize-fixtures");
const models = require("../../../app/models");

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
              message: "Name must be at least 3 characters long",
            }),
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
              message: "Please provide a valid email",
            }),
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
              message: "Password must be at least 6 characters long",
            }),
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
              message: "Passwords do not match",
            }),
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
              message: "User type must be either artist or venue",
            }),
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
              message: "You must agree to the terms and conditions",
            }),
          ])
        );
      });

      it("should fail when email is already registered", async () => {
        const duplicateUserFixture = [
          {
            model: "User",
            data: {
              name: "Test User",
              email: "duplicate@example.com",
              password: "password123",
              userType: "artist",
              agreeTermsAndConditions: true,
            },
          },
        ];

        // First load the fixture user
        await sequelizeFixtures.loadFixtures(duplicateUserFixture, models);

        // Try to register with the same email
        const userData = {
          name: "Test User",
          email: "duplicate@example.com",
          password: "password123",
          confirm_password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        };

        const response = await request(app)
          .post("/api/v1/auth/register")
          .send(userData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Email already registered");

        // Clean up
        await User.destroy({ where: { email: "duplicate@example.com" } });
      });
    });
  });

  describe("/api/v1/auth/login", () => {
    const testUserFixture = [
      {
        model: "User",
        data: {
          name: "Test User",
          email: "testlogin@example.com",
          password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        },
      },
    ];

    beforeEach(async () => {
      await sequelizeFixtures.loadFixtures(testUserFixture, models);
    });

    afterEach(async () => {
      // Clean up the test user after each test
      await User.destroy({ where: { email: "testlogin@example.com" } });
    });

    describe("success", () => {
      it("should successfully login with valid credentials and return tokens", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "testlogin@example.com",
            password: "password123",
          })
          .expect("Content-Type", /json/)
          .expect(200);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body).toHaveProperty("message", "Login successful");
        expect(response.body.data).toHaveProperty("accessToken");
        expect(response.body.data).toHaveProperty("refreshToken");

        // Verify token format (JWT format is xxx.yyy.zzz)
        expect(response.body.data.accessToken).toBeTruthy();
        expect(response.body.data.refreshToken).toBeTruthy();
      });
    });

    describe("failure", () => {
      it("should fail when email does not exist", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "nonexistent@example.com",
            password: "password123",
          })
          .expect("Content-Type", /json/)
          .expect(401);

        console.log(response.body);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Invalid email or password"
        );
      });

      it("should fail when password is incorrect", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "testlogin@example.com",
            password: "wrongpassword",
          })
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Invalid email or password"
        );
      });

      it("should fail when email format is invalid", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "invalid-email-format",
            password: "password123",
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "email",
              message: "Please provide a valid email",
            }),
          ])
        );
      });

      it("should fail when email is missing", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            password: "password123",
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "email",
              message: "Email is required",
            }),
          ])
        );
      });

      it("should fail when password is missing", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "testlogin@example.com",
          })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "password",
              message: "Password is required",
            }),
          ])
        );
      });
    });
  });

  describe("/api/v1/auth/logout", () => {
    let accessToken;
    const testUserFixture = [
      {
        model: "User",
        data: {
          name: "Test User",
          email: "testlogout@example.com",
          password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        },
      },
    ];

    beforeEach(async () => {
      // Load the test user using fixtures
      await sequelizeFixtures.loadFixtures(testUserFixture, models);

      // Login to get access token
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "testlogout@example.com",
          password: "password123",
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    afterEach(async () => {
      // Clean up the test user after each test
      await User.destroy({ where: { email: "testlogout@example.com" } });
    });

    describe("success", () => {
      it("should successfully logout with valid token", async () => {
        const response = await request(app)
          .post("/api/v1/auth/logout")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(204);
      });
    });

    describe("failure", () => {
      it("should fail when no token is provided", async () => {
        const response = await request(app)
          .post("/api/v1/auth/logout")
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when invalid token is provided", async () => {
        const response = await request(app)
          .post("/api/v1/auth/logout")
          .set("Authorization", "Bearer invalid.token.here")
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Invalid token");
      });
    });
  });

  describe("/api/v1/auth/refresh", () => {
    let accessToken;
    let refreshToken;
    const testUserFixture = [
      {
        model: "User",
        data: {
          name: "Test User",
          email: "testrefresh@example.com",
          password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        },
      },
    ];

    beforeEach(async () => {
      // Load the test user using fixtures
      await sequelizeFixtures.loadFixtures(testUserFixture, models);

      // Login to get initial tokens
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "testrefresh@example.com",
          password: "password123",
        });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    afterEach(async () => {
      // Clean up the test user after each test
      await User.destroy({ where: { email: "testrefresh@example.com" } });
    });

    describe("success", () => {
      it("should return new access and refresh tokens with valid refresh token", async () => {
        const response = await request(app)
          .post("/api/v1/auth/refresh")
          .send({ refreshToken })
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data).toHaveProperty("accessToken");
      });
    });

    describe("failure", () => {
      it("should fail when refresh token is not provided", async () => {
        const response = await request(app)
          .post("/api/v1/auth/refresh")
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "refreshToken",
              message: "Refresh token is required",
            }),
          ])
        );
      });

      it("should fail when invalid refresh token is provided", async () => {
        const response = await request(app)
          .post("/api/v1/auth/refresh")
          .send({ refreshToken: "invalid.refresh.token" })
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Invalid refresh token");
      });

      it("should fail when user associated with refresh token does not exist", async () => {
        // Delete the user while their refresh token is still valid
        await User.destroy({ where: { email: "testrefresh@example.com" } });

        const response = await request(app)
          .post("/api/v1/auth/refresh")
          .send({ refreshToken })
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "User not found");
      });
    });
  });
});
