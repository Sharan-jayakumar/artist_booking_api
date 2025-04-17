const request = require("supertest");
const app = require("../../../app");
const { User, Gig } = require("../../../app/models");
const sequelizeFixtures = require("sequelize-fixtures");
const models = require("../../../app/models");

describe("Artist Gig Routes", () => {
  let venueUserId;
  let venueAccessToken;
  let artistAccessToken;
  let testGigs = [];

  const venueUserFixture = [
    {
      model: "User",
      data: {
        name: "Test Venue",
        email: "testvenue2@example.com",
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
        email: "testartist2@example.com",
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

    // Get the venue user ID for creating gigs
    const venueUser = await User.findOne({
      where: { email: "testvenue2@example.com" },
    });
    venueUserId = venueUser.id;

    // Login to get access tokens
    const venueLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "testvenue2@example.com",
        password: "password123",
      });

    const artistLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "testartist2@example.com",
        password: "password123",
      });

    venueAccessToken = venueLoginResponse.body.data.accessToken;
    artistAccessToken = artistLoginResponse.body.data.accessToken;

    // Create test gigs for listing and pagination
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

  afterEach(async () => {
    // Clean up test data after each test
    await Gig.destroy({ where: {}, force: true });
    await User.destroy({
      where: {
        email: {
          [models.Sequelize.Op.in]: [
            "testvenue2@example.com",
            "testartist2@example.com",
          ],
        },
      },
    });
    testGigs = [];
  });

  describe("GET /api/v1/artists/gigs", () => {
    describe("success", () => {
      it("should return paginated list of all gigs for artist users", async () => {
        const response = await request(app)
          .get("/api/v1/artists/gigs")
          .set("Authorization", `Bearer ${artistAccessToken}`)
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
      });

      it("should support custom pagination parameters", async () => {
        const response = await request(app)
          .get("/api/v1/artists/gigs?page=2&limit=5")
          .set("Authorization", `Bearer ${artistAccessToken}`)
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
          .get("/api/v1/artists/gigs?search=UniqueSearchable")
          .set("Authorization", `Bearer ${artistAccessToken}`)
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
          .get("/api/v1/artists/gigs")
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when venue tries to access artist gigs route", async () => {
        const response = await request(app)
          .get("/api/v1/artists/gigs")
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only artist users can view gig listings"
        );
      });

      it("should fail with invalid pagination parameters", async () => {
        const response = await request(app)
          .get("/api/v1/artists/gigs?page=-1&limit=1000")
          .set("Authorization", `Bearer ${artistAccessToken}`)
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

  describe("GET /api/v1/artists/gigs/:id", () => {
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
      it("should return a specific gig by ID for artist user", async () => {
        const response = await request(app)
          .get(`/api/v1/artists/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
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
          .get(`/api/v1/artists/gigs/${testGig.id}`)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when venue tries to access artist gig route", async () => {
        const response = await request(app)
          .get(`/api/v1/artists/gigs/${testGig.id}`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "Only artist users can view gigs"
        );
      });

      it("should return 404 when gig does not exist", async () => {
        const nonExistentId = 99999;
        const response = await request(app)
          .get(`/api/v1/artists/gigs/${nonExistentId}`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");
      });

      it("should fail with invalid gig ID format", async () => {
        const response = await request(app)
          .get("/api/v1/artists/gigs/invalid-id")
          .set("Authorization", `Bearer ${artistAccessToken}`)
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
});
