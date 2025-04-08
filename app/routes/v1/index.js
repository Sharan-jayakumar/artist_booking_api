const express = require("express");
const router = express.Router();

// V1 routes go here
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to API V1",
  });
});

// Add other versioned routes here
// Example: router.use("/artists", artistRoutes);
// Example: router.use("/bookings", bookingRoutes);

module.exports = router;