const { param, query, body } = require("express-validator");

const getMessagesValidation = [
  param("id")
    .notEmpty()
    .withMessage("Proposal ID is required")
    .isInt({ min: 1 })
    .withMessage("Proposal ID must be a positive integer"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const createMessageValidation = [
  param("id")
    .notEmpty()
    .withMessage("Proposal ID is required")
    .isInt({ min: 1 })
    .withMessage("Proposal ID must be a positive integer"),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters")
    .trim(),
];

module.exports = {
  getMessagesValidation,
  createMessageValidation,
};
