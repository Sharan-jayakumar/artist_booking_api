const request = require("supertest");
const app = require("../../../app");
const { User, Gig } = require("../../../app/models");
const sequelizeFixtures = require("sequelize-fixtures");
const models = require("../../../app/models");

describe("Gig Routes", () => {
  let venueUserId;
  let venueAccessToken;
  let artistAccessToken;

  const venueUserFixture = [
    {
      model: "User",
      data: {
        name: "Test Venue",
        email: "testvenue1@example.com",
        password: "password123",
        userType: "venue",
        agreeTermsAndConditions: true,
      },
    },
  ];

  const artistUserFixture = [
    {
      model: "User",
      data: {
        name: "Test Artist",
        email: "testartist1@example.com",
        password: "password123",
        userType: "artist",
        agreeTermsAndConditions: true,
      },
    },
  ];

  beforeEach(async () => {
    // Load the test users using fixtures
    await sequelizeFixtures.loadFixtures(venueUserFixture, models);
    await sequelizeFixtures.loadFixtures(artistUserFixture, models);
    // Get the venue user ID for verification
    const venueUser = await User.findOne({
      where: { email: "testvenue1@example.com" },
    });
    venueUserId = venueUser.id;

    // Login to get access tokens
    const venueLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "testvenue1@example.com",
        password: "password123",
      });

    const artistLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "testartist1@example.com",
        password: "password123",
      });

    venueAccessToken = venueLoginResponse.body.data.accessToken;
    artistAccessToken = artistLoginResponse.body.data.accessToken;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await Gig.destroy({ where: {}, force: true });
    await User.destroy({
      where: {
        email: {
          [models.Sequelize.Op.in]: [
            "testvenue1@example.com",
            "testartist1@example.com",
          ],
        },
      },
    });
  });

  describe("POST /api/v1/venues/gigs", () => {
    const validGigData = {
      name: "Jazz Night",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 7 days from now
      venue: "Blue Note Jazz Club",
      hourlyRate: 75.0,
      estimatedAudienceSize: 100,
      startTime: (() => {
        const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        date.setHours(19, 0, 0, 0);
        return date.toISOString();
      })(),
      endTime: (() => {
        const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        date.setHours(22, 0, 0, 0);
        return date.toISOString();
      })(),
      equipment:
        "PA system and basic stage setup provided. Musicians should bring their own instruments.",
      jobDetails:
        "Looking for a jazz quartet to play a mix of standards and originals for a restaurant opening.",
    };

    describe("success", () => {
      it("should successfully create a gig with valid data using hourly rate", async () => {
        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(validGigData)
          .expect("Content-Type", /json/)
          .expect(201);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body).toHaveProperty(
          "message",
          "Gig created successfully"
        );
        expect(response.body.data).toHaveProperty("gig");

        // Check gig data
        const gig = response.body.data.gig;
        expect(gig).toHaveProperty("id");
        expect(gig).toHaveProperty("userId", venueUserId);
        expect(gig).toHaveProperty("name", validGigData.name);
        expect(gig).toHaveProperty("date");
        expect(gig).toHaveProperty("venue", validGigData.venue);
        expect(gig).toHaveProperty("hourlyRate", "75.00");
        expect(gig).toHaveProperty(
          "estimatedAudienceSize",
          validGigData.estimatedAudienceSize
        );
        expect(gig).toHaveProperty("totalHours", "03:00:00"); // 3 hours from 19:00 to 22:00
        expect(gig).toHaveProperty("equipment", validGigData.equipment);
        expect(gig).toHaveProperty("jobDetails", validGigData.jobDetails);
      });

      it("should successfully create a gig with valid data using full gig amount", async () => {
        const gigDataWithFullAmount = {
          ...validGigData,
          hourlyRate: 0,
          fullGigAmount: 350.0,
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(gigDataWithFullAmount)
          .expect("Content-Type", /json/)
          .expect(201);

        // Check response structure
        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data.gig).toHaveProperty(
          "fullGigAmount",
          "350.00"
        );
        expect(response.body.data.gig).toHaveProperty("hourlyRate", null);
      });

      it("should create a gig with minimal required fields", async () => {
        const minimalGigData = {
          name: "Quick Gig",
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          venue: "Local Bar",
          fullGigAmount: 200.0,
          startTime: (() => {
            const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
            date.setHours(20, 0, 0, 0);
            return date.toISOString();
          })(),
          endTime: (() => {
            const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
            date.setHours(22, 0, 0, 0);
            return date.toISOString();
          })(),
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(minimalGigData)
          .expect("Content-Type", /json/)
          .expect(201);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data.gig).toHaveProperty(
          "name",
          minimalGigData.name
        );
        expect(response.body.data.gig).toHaveProperty(
          "estimatedAudienceSize",
          null
        );
        expect(response.body.data.gig).toHaveProperty("equipment", null);
        expect(response.body.data.gig).toHaveProperty("jobDetails", null);
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .send(validGigData)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when an artist tries to create a gig", async () => {
        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(validGigData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only artists can create or update artist profiles"
        );
      });

      it("should fail when required fields are missing", async () => {
        const invalidData = {
          // Missing name
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          // Missing venue
          hourlyRate: 75.0,
          // Missing startTime
          endTime: (() => {
            const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            date.setHours(22, 0, 0, 0);
            return date.toISOString();
          })(),
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("error");

        // Check for the validation error messages
        const errors = response.body.error.map((err) => err.field);
        expect(errors).toContain("name");
        expect(errors).toContain("venue");
        expect(errors).toContain("startTime");
      });

      it("should fail when no payment option is provided", async () => {
        const invalidData = {
          ...validGigData,
          hourlyRate: null,
          fullGigAmount: null,
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });

      it("should fail when both payment options are provided", async () => {
        const invalidData = {
          ...validGigData,
          hourlyRate: 75.0,
          fullGigAmount: 350.0,
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });

      it("should fail when date is in the past", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        const invalidData = {
          ...validGigData,
          date: pastDate.toISOString().split("T")[0],
          startTime: (() => {
            const date = new Date(pastDate);
            date.setHours(19, 0, 0, 0);
            return date.toISOString();
          })(),
          endTime: (() => {
            const date = new Date(pastDate);
            date.setHours(22, 0, 0, 0);
            return date.toISOString();
          })(),
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });

      it("should fail when start time is after end time", async () => {
        const invalidData = {
          ...validGigData,
          startTime: validGigData.endTime,
          endTime: validGigData.startTime,
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });

      it("should fail when times and date don't match", async () => {
        // Set start and end time to a different day than the gig date
        const differentDay = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

        const invalidData = {
          ...validGigData,
          // Keep date as 7 days from now
          // But set times to 8 days from now
          startTime: (() => {
            const date = new Date(differentDay);
            date.setHours(19, 0, 0, 0);
            return date.toISOString();
          })(),
          endTime: (() => {
            const date = new Date(differentDay);
            date.setHours(22, 0, 0, 0);
            return date.toISOString();
          })(),
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });

      it("should fail with negative hourly rate", async () => {
        const invalidData = {
          ...validGigData,
          hourlyRate: -50.0,
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });

      it("should fail with negative audience size", async () => {
        const invalidData = {
          ...validGigData,
          estimatedAudienceSize: -10,
        };

        const response = await request(app)
          .post("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
      });
    });
  });

  describe("GET /api/v1/venues/gigs", () => {
    let testGigs = [];

    beforeEach(async () => {
      // Create additional test gigs for pagination testing
      for (let i = 1; i <= 15; i++) {
        const gigData = {
          userId: venueUserId,
          name: `Test Gig ${i}`,
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          venue: "Test Venue",
          fullGigAmount: 200.0,
          startTime: (() => {
            const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
            date.setHours(19, 0, 0, 0);
            return date.toISOString();
          })(),
          endTime: (() => {
            const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
            date.setHours(22, 0, 0, 0);
            return date.toISOString();
          })(),
        };
        const gig = await Gig.create(gigData);
        testGigs.push(gig);
      }
    });

    describe("success", () => {
      it("should return paginated list of gigs for venue user", async () => {
        const response = await request(app)
          .get("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data).toHaveProperty("gigs");
        expect(response.body.data).toHaveProperty("pagination");
        expect(response.body.data.gigs).toBeInstanceOf(Array);

        // Check pagination info
        expect(response.body.data.pagination).toHaveProperty("total");
        expect(response.body.data.pagination).toHaveProperty("page", 1);
        expect(response.body.data.pagination).toHaveProperty("limit", 10);
        expect(response.body.data.pagination).toHaveProperty("totalPages");
        expect(response.body.data.pagination).toHaveProperty("hasNextPage");
        expect(response.body.data.pagination).toHaveProperty("hasPrevPage");

        // Should return 10 items for first page (default limit)
        expect(response.body.data.gigs.length).toBeLessThanOrEqual(10);

        // All gigs should belong to the venue user
        for (const gig of response.body.data.gigs) {
          expect(gig).toHaveProperty("userId", venueUserId);
        }
      });

      it("should support custom pagination parameters", async () => {
        const response = await request(app)
          .get("/api/v1/venues/gigs?page=2&limit=5")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body.data.pagination).toHaveProperty("page", 2);
        expect(response.body.data.pagination).toHaveProperty("limit", 5);
        expect(response.body.data.gigs.length).toBeLessThanOrEqual(5);
      });

      it("should support search functionality", async () => {
        // Create a gig with a unique name for testing search
        const uniqueGigData = {
          userId: venueUserId,
          name: "UniqueSearchableGigName",
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          venue: "Test Venue",
          fullGigAmount: 200.0,
          startTime: (() => {
            const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
            date.setHours(19, 0, 0, 0);
            return date.toISOString();
          })(),
          endTime: (() => {
            const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
            date.setHours(22, 0, 0, 0);
            return date.toISOString();
          })(),
        };
        await Gig.create(uniqueGigData);

        const response = await request(app)
          .get("/api/v1/venues/gigs?search=UniqueSearchable")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body.data.gigs.length).toBeGreaterThanOrEqual(1);
        expect(response.body.data.gigs[0]).toHaveProperty(
          "name",
          "UniqueSearchableGigName"
        );
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .get("/api/v1/venues/gigs")
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when artist tries to access venue gigs", async () => {
        const response = await request(app)
          .get("/api/v1/venues/gigs")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only venue users can access gig listings"
        );
      });

      it("should fail with invalid pagination parameters", async () => {
        const response = await request(app)
          .get("/api/v1/venues/gigs?page=-1&limit=1000")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("error");

        // Verify specific validation errors
        const errorFields = response.body.error.map((err) => err.field);
        expect(errorFields).toContain("page");
        expect(errorFields).toContain("limit");
      });
    });
  });

  describe("GET /api/v1/venues/gigs/:id", () => {
    let testGig;

    beforeEach(async () => {
      // Create a test gig
      const gigData = {
        userId: venueUserId,
        name: "Test Single Gig",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        venue: "Test Venue",
        fullGigAmount: 200.0,
        startTime: (() => {
          const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          date.setHours(19, 0, 0, 0);
          return date.toISOString();
        })(),
        endTime: (() => {
          const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          date.setHours(22, 0, 0, 0);
          return date.toISOString();
        })(),
      };
      testGig = await Gig.create(gigData);
    });

    describe("success", () => {
      it("should return a specific gig by ID for venue user", async () => {
        const response = await request(app)
          .get(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data).toHaveProperty("gig");
        expect(response.body.data.gig).toHaveProperty("id", testGig.id);
        expect(response.body.data.gig).toHaveProperty(
          "name",
          "Test Single Gig"
        );
        expect(response.body.data.gig).toHaveProperty("userId", venueUserId);
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .get(`/api/v1/venues/gigs/${testGig.id}`)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when artist tries to access venue gig", async () => {
        const response = await request(app)
          .get(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only venue users can access gigs"
        );
      });

      it("should return 404 when gig does not exist", async () => {
        const nonExistentId = 99999;
        const response = await request(app)
          .get(`/api/v1/venues/gigs/${nonExistentId}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");
      });

      it("should fail when venue tries to access another venue's gig", async () => {
        // Create another venue user
        const anotherVenueFixture = [
          {
            model: "User",
            data: {
              name: "Another Venue",
              email: "anothervenue@example.com",
              password: "password123",
              userType: "venue",
              agreeTermsAndConditions: true,
            },
          },
        ];

        await sequelizeFixtures.loadFixtures(anotherVenueFixture, models);

        // Login with the other venue
        const anotherVenueLoginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "anothervenue@example.com",
            password: "password123",
          });

        const anotherVenueToken =
          anotherVenueLoginResponse.body.data.accessToken;

        // Try to access the gig that belongs to the first venue
        const response = await request(app)
          .get(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${anotherVenueToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");

        // Clean up
        await User.destroy({ where: { email: "anothervenue@example.com" } });
      });

      it("should fail with invalid gig ID format", async () => {
        const response = await request(app)
          .get("/api/v1/venues/gigs/invalid-id")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("error");

        expect(response.body.error[0]).toHaveProperty(
          "message",
          "Gig ID must be a positive integer"
        );
      });
    });
  });

  describe("PATCH /api/v1/venues/gigs/:id", () => {
    let testGig;

    beforeEach(async () => {
      // Create a test gig to update
      const gigData = {
        userId: venueUserId,
        name: "Test Update Gig",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        venue: "Test Venue",
        fullGigAmount: 200.0,
        startTime: (() => {
          const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          date.setHours(19, 0, 0, 0);
          return date.toISOString();
        })(),
        endTime: (() => {
          const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          date.setHours(22, 0, 0, 0);
          return date.toISOString();
        })(),
      };
      testGig = await Gig.create(gigData);
    });

    describe("success", () => {
      it("should successfully update a gig with valid data", async () => {
        const updateData = {
          name: "Updated Gig Name",
          venue: "Updated Venue",
          equipment: "Updated equipment",
        };

        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(updateData)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body).toHaveProperty(
          "message",
          "Gig updated successfully"
        );
        expect(response.body.data).toHaveProperty("gig");

        // Check updated fields
        expect(response.body.data.gig).toHaveProperty("name", updateData.name);
        expect(response.body.data.gig).toHaveProperty(
          "venue",
          updateData.venue
        );
        expect(response.body.data.gig).toHaveProperty(
          "equipment",
          updateData.equipment
        );

        // Check unchanged fields
        expect(response.body.data.gig).toHaveProperty(
          "fullGigAmount",
          "200.00"
        );
        expect(response.body.data.gig).toHaveProperty("userId", venueUserId);
      });

      it("should successfully update payment option from fullGigAmount to hourlyRate", async () => {
        const updateData = {
          hourlyRate: 75.0,
          fullGigAmount: null,
        };

        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(updateData)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data.gig).toHaveProperty("hourlyRate", 75);
        expect(response.body.data.gig).toHaveProperty("fullGigAmount", null);
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${testGig.id}`)
          .send({ name: "Updated Name" })
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when artist tries to update venue gig", async () => {
        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send({ name: "Updated Name" })
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only venue users can update gigs"
        );
      });

      it("should fail when updating a non-existent gig", async () => {
        const nonExistentId = 99999;
        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${nonExistentId}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send({ name: "Updated Name" })
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");
      });

      it("should fail when validation fails", async () => {
        const invalidData = {
          name: "A", // Too short
          date: "invalid-date",
          hourlyRate: -50, // Negative
        };

        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(invalidData)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("error");

        // Check specific error messages
        const errorFields = response.body.error.map((err) => err.field);
        expect(errorFields).toContain("name");
        expect(errorFields).toContain("date");
        expect(errorFields).toContain("hourlyRate");
      });

      it("should fail when venue tries to update another venue's gig", async () => {
        // Create another venue user
        const anotherVenueFixture = [
          {
            model: "User",
            data: {
              name: "Another Venue",
              email: "anothervenue@example.com",
              password: "password123",
              userType: "venue",
              agreeTermsAndConditions: true,
            },
          },
        ];

        await sequelizeFixtures.loadFixtures(anotherVenueFixture, models);

        // Login with the other venue
        const anotherVenueLoginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "anothervenue@example.com",
            password: "password123",
          });

        const anotherVenueToken =
          anotherVenueLoginResponse.body.data.accessToken;

        // Try to update the gig that belongs to the first venue
        const response = await request(app)
          .patch(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${anotherVenueToken}`)
          .send({ name: "Updated Name" })
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");

        // Clean up
        await User.destroy({ where: { email: "anothervenue@example.com" } });
      });
    });
  });

  describe("DELETE /api/v1/venues/gigs/:id", () => {
    let testGig;

    beforeEach(async () => {
      // Create a test gig to delete
      const gigData = {
        userId: venueUserId,
        name: "Test Delete Gig",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        venue: "Test Venue",
        fullGigAmount: 200.0,
        startTime: (() => {
          const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          date.setHours(19, 0, 0, 0);
          return date.toISOString();
        })(),
        endTime: (() => {
          const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          date.setHours(22, 0, 0, 0);
          return date.toISOString();
        })(),
      };
      testGig = await Gig.create(gigData);
    });

    describe("success", () => {
      it("should successfully delete a gig", async () => {
        await request(app)
          .delete(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect(204);

        // Verify gig is deleted
        const deletedGig = await Gig.findByPk(testGig.id);
        expect(deletedGig).toBeNull();
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .delete(`/api/v1/venues/gigs/${testGig.id}`)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when artist tries to delete venue gig", async () => {
        const response = await request(app)
          .delete(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only venue users can delete gigs"
        );
      });

      it("should fail when deleting a non-existent gig", async () => {
        const nonExistentId = 99999;
        const response = await request(app)
          .delete(`/api/v1/venues/gigs/${nonExistentId}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");
      });

      it("should fail when venue tries to delete another venue's gig", async () => {
        // Create another venue user
        const anotherVenueFixture = [
          {
            model: "User",
            data: {
              name: "Another Venue",
              email: "anothervenue@example.com",
              password: "password123",
              userType: "venue",
              agreeTermsAndConditions: true,
            },
          },
        ];

        await sequelizeFixtures.loadFixtures(anotherVenueFixture, models);

        // Login with the other venue
        const anotherVenueLoginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "anothervenue@example.com",
            password: "password123",
          });

        const anotherVenueToken =
          anotherVenueLoginResponse.body.data.accessToken;

        // Try to delete the gig that belongs to the first venue
        const response = await request(app)
          .delete(`/api/v1/venues/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${anotherVenueToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");

        // Clean up
        await User.destroy({ where: { email: "anothervenue@example.com" } });
      });

      it("should fail with invalid gig ID format", async () => {
        const response = await request(app)
          .delete("/api/v1/venues/gigs/invalid-id")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("error");

        const errorFields = response.body.error.map((err) => err.field);
        expect(errorFields).toContain("id");
      });
    });
  });
});
