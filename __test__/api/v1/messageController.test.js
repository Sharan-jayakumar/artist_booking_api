const request = require("supertest");
const app = require("../../../app");
const { User, Gig } = require("../../../app/models");
const sequelizeFixtures = require("sequelize-fixtures");
const models = require("../../../app/models");
const { messages } = require("../../../app/controllers/messageController");
const {
  gigProposals,
} = require("../../../app/controllers/artistGigController");

describe("Message Routes", () => {
  let venueUser;
  let artistUser;
  let venueAccessToken;
  let artistAccessToken;
  let testGig;
  let testProposal;

  const venueUserFixture = [
    {
      model: "User",
      data: {
        name: "Test Venue",
        email: "testvenue4@example.com",
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
        email: "testartist4@example.com",
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

    // Get users
    venueUser = await User.findOne({
      where: { email: "testvenue4@example.com" },
    });
    artistUser = await User.findOne({
      where: { email: "testartist4@example.com" },
    });

    // Login to get access tokens
    const venueLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "testvenue4@example.com",
        password: "password123",
      });

    const artistLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "testartist4@example.com",
        password: "password123",
      });

    venueAccessToken = venueLoginResponse.body.data.accessToken;
    artistAccessToken = artistLoginResponse.body.data.accessToken;

    // Create a test gig
    testGig = await Gig.create({
      userId: venueUser.id,
      name: "Test Gig for Messages",
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
    });

    // Create a test proposal
    testProposal = {
      id: 1,
      gigId: testGig.id,
      artistId: artistUser.id,
      hourlyRate: 100,
      fullGigAmount: null,
      coverLetter: "Test cover letter",
      status: "pending",
      createdAt: new Date(),
    };

    // Reset arrays
    while (gigProposals.length > 0) gigProposals.pop();
    while (messages.length > 0) messages.pop();

    gigProposals.push(testProposal);
  });

  afterEach(async () => {
    // Clean up test data
    await Gig.destroy({ where: {}, force: true });
    await User.destroy({
      where: {
        email: {
          [models.Sequelize.Op.in]: [
            "testvenue4@example.com",
            "testartist4@example.com",
          ],
        },
      },
    });
    while (gigProposals.length > 0) gigProposals.pop();
    while (messages.length > 0) messages.pop();
  });

  describe("GET /api/v1/proposals/:id/messages", () => {
    beforeEach(() => {
      // Add test messages
      const testMessages = [
        {
          id: 1,
          proposalId: testProposal.id,
          senderId: artistUser.id,
          senderType: "artist",
          message: "When should I arrive for setup?",
          createdAt: new Date(Date.now() - 2000),
        },
        {
          id: 2,
          proposalId: testProposal.id,
          senderId: venueUser.id,
          senderType: "venue",
          message: "Please arrive at 6 PM",
          createdAt: new Date(Date.now() - 1000),
        },
        {
          id: 3,
          proposalId: testProposal.id,
          senderId: artistUser.id,
          senderType: "artist",
          message: "Great, see you then!",
          createdAt: new Date(),
        },
      ];

      messages.push(...testMessages);
    });

    describe("success", () => {
      it("should return messages in descending order by createdAt", async () => {
        const response = await request(app)
          .get(`/api/v1/proposals/${testProposal.id}/messages`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data).toHaveProperty("messages");
        expect(response.body.data.messages).toHaveLength(3);

        // Check descending order
        const timestamps = response.body.data.messages.map((m) =>
          new Date(m.createdAt).getTime()
        );
        expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
      });

      it("should support pagination", async () => {
        const response = await request(app)
          .get(`/api/v1/proposals/${testProposal.id}/messages?page=1&limit=2`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body.data.messages).toHaveLength(2);
        expect(response.body.data.pagination).toEqual({
          total: 3,
          page: 1,
          limit: 2,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
        });
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .get(`/api/v1/proposals/${testProposal.id}/messages`)
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when proposal does not exist", async () => {
        const response = await request(app)
          .get("/api/v1/proposals/999/messages")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Proposal not found");
      });

      it("should fail when user is not involved in the proposal", async () => {
        // Create another user
        const otherUserFixture = [
          {
            model: "User",
            data: {
              name: "Other User",
              email: "other0@example.com",
              password: "password123",
              userType: "artist",
              agreeTermsAndConditions: true,
            },
          },
        ];

        await sequelizeFixtures.loadFixtures(otherUserFixture, models);
        const otherLoginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "other0@example.com",
            password: "password123",
          });

        const response = await request(app)
          .get(`/api/v1/proposals/${testProposal.id}/messages`)
          .set(
            "Authorization",
            `Bearer ${otherLoginResponse.body.data.accessToken}`
          )
          .expect("Content-Type", /json/)
          .expect(403);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty(
          "message",
          "You don't have permission to view these messages"
        );

        // Clean up
        await User.destroy({ where: { email: "other0@example.com" } });
      });
    });
  });

  describe("POST /api/v1/proposals/:id/messages", () => {
    describe("success", () => {
      it("should allow artist to create a message", async () => {
        const messageData = {
          message: "Hello, I have a question about the gig",
        };

        const response = await request(app)
          .post(`/api/v1/proposals/${testProposal.id}/messages`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send(messageData)
          .expect("Content-Type", /json/)
          .expect(201);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data.message).toMatchObject({
          proposalId: testProposal.id,
          senderId: artistUser.id,
          senderType: "artist",
          message: messageData.message,
        });
      });

      it("should allow venue to create a message", async () => {
        const messageData = {
          message: "Sure, what would you like to know?",
        };

        const response = await request(app)
          .post(`/api/v1/proposals/${testProposal.id}/messages`)
          .set("Authorization", `Bearer ${venueAccessToken}`)
          .send(messageData)
          .expect("Content-Type", /json/)
          .expect(201);

        expect(response.body).toHaveProperty("status", "success");
        expect(response.body.data.message).toMatchObject({
          proposalId: testProposal.id,
          senderId: venueUser.id,
          senderType: "venue",
          message: messageData.message,
        });
      });
    });

    describe("failure", () => {
      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .post(`/api/v1/proposals/${testProposal.id}/messages`)
          .send({ message: "Test message" })
          .expect("Content-Type", /json/)
          .expect(401);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "No token provided");
      });

      it("should fail when message is empty", async () => {
        const response = await request(app)
          .post(`/api/v1/proposals/${testProposal.id}/messages`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send({ message: "" })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error[0]).toHaveProperty(
          "message",
          "Message is required"
        );
      });

      it("should fail when message is too long", async () => {
        const longMessage = "a".repeat(1001);
        const response = await request(app)
          .post(`/api/v1/proposals/${testProposal.id}/messages`)
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send({ message: longMessage })
          .expect("Content-Type", /json/)
          .expect(400);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body.error[0]).toHaveProperty(
          "message",
          "Message must be between 1 and 1000 characters"
        );
      });

      it("should fail when proposal does not exist", async () => {
        const response = await request(app)
          .post("/api/v1/proposals/999/messages")
          .set("Authorization", `Bearer ${artistAccessToken}`)
          .send({ message: "Test message" })
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Proposal not found");
      });

      it("should fail when user is not involved in the proposal", async () => {
        // Create another user
        const otherUserFixture = [
          {
            model: "User",
            data: {
              name: "Other User",
              email: "other0@example.com",
              password: "password123",
              userType: "artist",
              agreeTermsAndConditions: true,
            },
          },
        ];

        await sequelizeFixtures.loadFixtures(otherUserFixture, models);
        const otherLoginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: "other0@example.com",
            password: "password123",
          });

        const response = await request(app)
          .post(`/api/v1/proposals/${testProposal.id}/messages`)
          .set(
            "Authorization",
            `Bearer ${otherLoginResponse.body.data.accessToken}`
          )
          .send({ message: "Test message" })
          .expect("Content-Type", /json/)
          .expect(404);

        expect(response.body).toHaveProperty("status", "fail");
        expect(response.body).toHaveProperty("message", "Gig not found");

        // Clean up
        await User.destroy({ where: { email: "other0@example.com" } });
      });
    });
  });
});
