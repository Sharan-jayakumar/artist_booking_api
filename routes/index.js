const express = require("express");
const v1Routes = require("./v1");
const router = express.Router();

// Welcome route
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the API. Please use /api/v1/ for version 1.",
  });
});

// Version 1 routes
router.use("/v1", v1Routes);

module.exports = router;
