const { body, query, param } = require("express-validator");

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

const createGigProposalValidation = [
  param("id")
    .notEmpty()
    .withMessage("Gig ID is required")
    .isInt({ min: 1 })
    .withMessage("Gig ID must be a positive integer"),

  body("hourlyRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Hourly rate must be a positive number"),

  body("fullGigAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Full gig amount must be a positive number"),

  body("coverLetter").notEmpty().withMessage("Cover letter is required").trim(),

  body().custom((value) => {
    if (!value.hourlyRate && !value.fullGigAmount) {
      throw new Error("Either hourly rate or full gig amount must be provided");
    }
    if (value.hourlyRate && value.fullGigAmount) {
      throw new Error("Cannot provide both hourly rate and full gig amount");
    }
    return true;
  }),
];

const requestGigCompletionValidation = [
  param("id")
    .notEmpty()
    .withMessage("Gig ID is required")
    .isInt({ min: 1 })
    .withMessage("Gig ID must be a positive integer"),

  body("confirmationCode")
    .notEmpty()
    .withMessage("Confirmation code is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Confirmation code must be between 3 and 50 characters")
    .trim(),

  body("locationAddress")
    .notEmpty()
    .withMessage("Location address is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Location address must be between 5 and 500 characters")
    .trim(),
];

module.exports = {
  listGigsValidation,
  getGigByIdValidation,
  createGigProposalValidation,
  requestGigCompletionValidation,
};
