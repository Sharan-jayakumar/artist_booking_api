const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");

/**
 * @swagger
 * tags:
 *   - name: API - V1 - Profile
 *     description: Profile management endpoints
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
router.use("/profile", profileRoutes);

module.exports = router;
