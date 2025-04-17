const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const venueRoutes = require("./venueRoutes");
const artistGigRoutes = require("./artistGigRoutes");

/**
 * @swagger
 * tags:
 *   - name: API - V1 - Profile
 *     description: Profile management endpoints
 *   - name: API - V1 - Gigs
 *     description: Gig management endpoints
 *   - name: API - V1 - Artist Gigs
 *     description: Artist gig endpoints for viewing available gigs
 *
 * /api/v1:
 *   get:
 *     summary: V1 API welcome route
 *     description: Returns a welcome message for API V1
 *     security: []
 *     tags:
 *       - API - V1
 *     responses:
 *       200:
 *         description: Welcome message for V1 API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to API V1
 */
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to API V1",
  });
});

// Auth routes
router.use("/auth", authRoutes);

// Profile routes
router.use("/", profileRoutes);

// Venue routes
router.use("/venues", venueRoutes);

// Artist gig routes
router.use("/artists", artistGigRoutes);

module.exports = router;
