const { body } = require("express-validator");

const updateArtistProfileValidation = [
  body("phoneNumber").notEmpty().withMessage("Phone number is required").trim(),

  body("skill").notEmpty().withMessage("Skill is required").trim(),

  body("bio").optional().trim(),

  body("stageName").notEmpty().withMessage("Stage name is required").trim(),

  body("accountHolderName")
    .notEmpty()
    .withMessage("Account holder name is required")
    .trim(),

  body("bsb")
    .notEmpty()
    .withMessage("BSB is required")
    .matches(/^\d{6}$/)
    .withMessage("BSB must be exactly 6 digits")
    .trim(),

  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required")
    .trim(),

  body("abn")
    .notEmpty()
    .withMessage("ABN is required")
    .matches(/^\d{11}$/)
    .withMessage("ABN must be exactly 11 digits")
    .trim(),

  body("links").isArray().withMessage("Links must be an array"),

  body("links.*.platform")
    .notEmpty()
    .withMessage("Platform is required for each link")
    .trim(),

  body("links.*.url")
    .notEmpty()
    .withMessage("URL is required for each link")
    .isURL()
    .withMessage("Invalid URL format")
    .trim(),
];

module.exports = {
  updateArtistProfileValidation,
};
