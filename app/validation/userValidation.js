const { body } = require("express-validator");

const registerUserValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("confirm_password")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("userType")
    .trim()
    .notEmpty()
    .withMessage("User type is required")
    .isIn(["artist", "venue"])
    .withMessage("User type must be either artist or venue"),

  body("agreeTermsAndConditions")
    .notEmpty()
    .withMessage("Terms and conditions acceptance is required")
    .isBoolean()
    .withMessage("Terms and conditions must be a boolean")
    .custom((value) => {
      if (!value) {
        throw new Error("You must agree to the terms and conditions");
      }
      return true;
    }),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

const refreshTokenValidation = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isString()
    .withMessage("Refresh token must be a string"),
];

module.exports = {
  registerUserValidation,
  loginValidation,
  refreshTokenValidation,
};
