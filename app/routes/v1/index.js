const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: V1 API welcome route
 *     description: Returns a welcome message for API V1
 *     tags: [V1]
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

// Add other versioned routes here
// Example: router.use("/artists", artistRoutes);
// Example: router.use("/bookings", bookingRoutes);

module.exports = router;
