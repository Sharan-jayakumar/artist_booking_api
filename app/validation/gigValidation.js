const { body, query, param } = require("express-validator");

const createGigValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Gig name is required")
    .isLength({ min: 3 })
    .withMessage("Gig name must be at least 3 characters long"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isDate()
    .withMessage("Date must be a valid date")
    .custom((value) => {
      if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error("Date must be in the future");
      }
      return true;
    }),

  body("venue").trim().notEmpty().withMessage("Venue is required"),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Start time must be a valid date and time")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Start time must be in the future");
      }
      return true;
    }),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("End time must be a valid date and time")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),

  body("hourlyRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Hourly rate must be a positive number")
    .custom((value, { req }) => {
      if (value && req.body.fullGigAmount) {
        throw new Error("Cannot provide both hourly rate and full gig amount");
      }
      return true;
    }),

  body("fullGigAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Full gig amount must be a positive number"),

  body("estimatedAudienceSize")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Estimated audience size must be a positive integer"),

  body("equipment").optional().trim(),

  body("jobDetails").optional().trim(),
];

const listGigsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search term must be a string")
    .trim(),
];

const getGigByIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Gig ID is required")
    .isInt({ min: 1 })
    .withMessage("Gig ID must be a positive integer"),
];

module.exports = {
  createGigValidation,
  listGigsValidation,
  getGigByIdValidation,
};
