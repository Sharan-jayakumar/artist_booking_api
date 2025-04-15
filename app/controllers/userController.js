const { User } = require("../models");
const AppError = require("../utils/AppError");

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, userType, agreeTermsAndConditions } =
      req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError("Email already registered", 400));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      userType,
      agreeTermsAndConditions,
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
};
