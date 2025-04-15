const express = require("express");
const v1Routes = require("./v1");
const router = express.Router();

/**
 * @swagger
 * /api/:
 *   get:
 *     summary: Welcome route
 *     description: Returns a welcome message for the API
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the API. Please use /api/v1/ for version 1.
 */
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the API. Please use /api/v1/ for version 1.",
  });
});

// Version 1 routes
router.use("/v1", v1Routes);

module.exports = router;
