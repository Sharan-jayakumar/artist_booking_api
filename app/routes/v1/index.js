const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoutes");

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

// User routes
router.use("/users", userRoutes);

module.exports = router;
