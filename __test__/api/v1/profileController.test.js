const request = require("supertest");
const app = require("../../../app");
const { User, ArtistProfile, ArtistLink } = require("../../../app/models");
const sequelizeFixtures = require("sequelize-fixtures");
const models = require("../../../app/models");

describe("Profile Routes", () => {
  describe("GET /api/v1/profile", () => {
    let accessToken;
    const testUserFixture = [
      {
        model: "User",
        data: {
          name: "Test Profile User",
          email: "testprofile@example.com",
          password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        },
      },
    ];

    beforeEach(async () => {
      // Load the test user using fixtures
      await sequelizeFixtures.loadFixtures(testUserFixture, models);

      // Login to get the access token
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "testprofile@example.com",
          password: "password123",
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    afterEach(async () => {
      // Clean up the test user after each test
      await User.destroy({ where: { email: "testprofile@example.com" } });
    });

    describe("success", () => {
      it("should successfully get user profile with valid token", async () => {
        const response = await request(app)
          .get("/api/v1/profile")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data).toHaveProperty("user");
        
        // Check user data properties (password should be excluded)
        const user = response.body.data.user;
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name", "Test Profile User");
        expect(user).toHaveProperty("email", "testprofile@example.com");
        expect(user).toHaveProperty("userType", "artist");
        expect(user).toHaveProperty("agreeTermsAndConditions", true);
        expect(user).not.toHaveProperty("password");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("updatedAt");
      });
    });

    describe("failure", () => {
      it("should fail when no token is provided", async () => {
        const response = await request(app)
          .get("/api/v1/profile")
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when invalid token is provided", async () => {
        const response = await request(app)
          .get("/api/v1/profile")
          .set("Authorization", "Bearer invalid.token.here")
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Invalid token");
      });

      it("should return 404 when user does not exist anymore", async () => {
        // First delete the user while we still have a valid token
        await User.destroy({ where: { email: "testprofile@example.com" } });

        // Now try to access the profile with the token of a deleted user
        const response = await request(app)
          .get("/api/v1/profile")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "User not found");
      });
    });
  });

  describe("PUT /api/v1/artists/profile", () => {
    let artistAccessToken;
    let venueAccessToken;
    const artistFixture = [
      {
        model: "User",
        data: {
          name: "Test Artist",
          email: "testartist@example.com",
          password: "password123",
          userType: "artist",
          agreeTermsAndConditions: true,
        },
      },
    ];

    const venueFixture = [
      {
        model: "User",
        data: {
          name: "Test Venue",
          email: "testvenue@example.com",
          password: "password123",
          userType: "venue",
          agreeTermsAndConditions: true,
        },
      },
    ];

    beforeEach(async () => {
      // Load the test users using fixtures
      await sequelizeFixtures.loadFixtures(artistFixture, models);
      await sequelizeFixtures.loadFixtures(venueFixture, models);

      // Login to get the access tokens
      const artistLoginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "testartist@example.com",
          password: "password123",
        });

      const venueLoginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "testvenue@example.com",
          password: "password123",
        });

        venueAccessToken = venueLoginResponse.body.data.accessToken;
      artistAccessToken = artistLoginResponse.body.data.accessToken;
    });

    afterEach(async () => {
      // Clean up all test data after each test
      await ArtistLink.destroy({
        where: {},
        force: true,
      });
      await ArtistProfile.destroy({
        where: {},
        force: true,
      });
      await User.destroy({
        where: {
          email: {
            [models.Sequelize.Op.in]: ["testartist@example.com", "testvenue@example.com"],
          },
        },
      });
    });

    const validProfileData = {
      phoneNumber: "1234567890",
      skill: "Guitarist",
      bio: "Experienced guitarist with 10 years experience",
      stageName: "Guitar Hero",
      accountHolderName: "John Doe",
      bsb: "123456",
      accountNumber: "987654321",
      abn: "12345678901",
      links: [
        {
          platform: "Instagram",
          url: "https://instagram.com/guitarhero"
        },
        {
          platform: "YouTube",
          url: "https://youtube.com/guitarhero"
        }
      ]
    };

    describe("success", () => {
      it("should create a new artist profile when one doesn't exist", async () => {
        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(validProfileData)
          .expect("Content-Type", /json/)
          .expect(200);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body).toHaveProperty("message", "Artist profile updated successfully");
        expect(response.body.data).toHaveProperty("profile");
        expect(response.body.data).toHaveProperty("links");
        
        // Check profile data
        const profile = response.body.data.profile;
        expect(profile).toHaveProperty("phoneNumber", validProfileData.phoneNumber);
        expect(profile).toHaveProperty("skill", validProfileData.skill);
        expect(profile).toHaveProperty("bio", validProfileData.bio);
        expect(profile).toHaveProperty("stageName", validProfileData.stageName);
        expect(profile).toHaveProperty("accountHolderName", validProfileData.accountHolderName);
        expect(profile).toHaveProperty("bsb", validProfileData.bsb);
        expect(profile).toHaveProperty("accountNumber", validProfileData.accountNumber);
        expect(profile).toHaveProperty("abn", validProfileData.abn);
        
        // Check links data
        expect(response.body.data.links).toHaveLength(2);
        expect(response.body.data.links[0]).toHaveProperty("platform", validProfileData.links[0].platform);
        expect(response.body.data.links[0]).toHaveProperty("url", validProfileData.links[0].url);
        expect(response.body.data.links[1]).toHaveProperty("platform", validProfileData.links[1].platform);
        expect(response.body.data.links[1]).toHaveProperty("url", validProfileData.links[1].url);
      });

      it("should update an existing artist profile", async () => {
        // First create the profile
        await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(validProfileData);
        
        // Then update it with new data
        const updatedProfileData = {
          ...validProfileData,
          phoneNumber: "0987654321",
          stageName: "Updated Hero",
          links: [
            {
              platform: "Twitter",
              url: "https://twitter.com/updatedhero"
            }
          ]
        };
        
        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(updatedProfileData)
          .expect("Content-Type", /json/)
          .expect(200);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data.profile).toHaveProperty("phoneNumber", updatedProfileData.phoneNumber);
        expect(response.body.data.profile).toHaveProperty("stageName", updatedProfileData.stageName);
        
        // Check that previous links were replaced
        expect(response.body.data.links).toHaveLength(1);
        expect(response.body.data.links[0]).toHaveProperty("platform", updatedProfileData.links[0].platform);
        expect(response.body.data.links[0]).toHaveProperty("url", updatedProfileData.links[0].url);
      });
    });

    describe("failure", () => {
      it("should fail when no token is provided", async () => {
        const response = await request(app)
          .put("/api/v1/artists/profile")
          .send(validProfileData)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when invalid token is provided", async () => {
        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", "Bearer invalid.token.here")
          .send(validProfileData)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Invalid token");
      });

      it("should not allow venue users to create artist profiles", async () => {
        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(validProfileData)
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Only artists can create or update artist profiles");
      });

      it("should fail validation when required fields are missing", async () => {
        const invalidData = {
          // Missing phoneNumber
          skill: "Guitarist",
          bio: "Experienced guitarist",
          // Missing stageName
          accountHolderName: "John Doe",
          bsb: "123456",
          accountNumber: "987654321",
          abn: "12345678901",
          links: [
            {
              platform: "Instagram",
              url: "https://instagram.com/guitarhero"
            }
          ]
        };

        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toContainEqual(
          expect.objectContaining({
            field: "phoneNumber",
            message: "Phone number is required"
          })
        );
        expect(response.body.error).toContainEqual(
          expect.objectContaining({
            field: "stageName",
            message: "Stage name is required"
          })
        );
      });

      it("should fail validation when BSB format is invalid", async () => {
        const invalidData = {
          ...validProfileData,
          bsb: "12345" // Invalid format (should be 6 digits)
        };

        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toContainEqual(
          expect.objectContaining({
            field: "bsb",
            message: "BSB must be exactly 6 digits"
          })
        );
      });

      it("should fail validation when ABN format is invalid", async () => {
        const invalidData = {
          ...validProfileData,
          abn: "1234567890" // Invalid format (should be 11 digits)
        };

        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toContainEqual(
          expect.objectContaining({
            field: "abn",
            message: "ABN must be exactly 11 digits"
          })
        );
      });

      it("should fail validation when links are invalid", async () => {
        const invalidData = {
          ...validProfileData,
          links: [
            {
              platform: "Instagram",
              url: "not-a-valid-url"
            }
          ]
        };

        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toContainEqual(
          expect.objectContaining({
            field: "links[0].url",
            message: "Invalid URL format"
          })
        );
      });

      it("should fail validation when links platform is missing", async () => {
        const invalidData = {
          ...validProfileData,
          links: [
            {
              // Missing platform
              url: "https://instagram.com/guitarhero"
            }
          ]
        };

        const response = await request(app)
          .put("/api/v1/artists/profile")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error).toContainEqual(
          expect.objectContaining({
            field: "links[0].platform",
            message: "Platform is required for each link"
          })
        );
      });
    });
  });
});