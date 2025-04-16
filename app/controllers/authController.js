const { User } = require("../models");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const { generateTokens } = require("../utils/generateTokens");

const register = async (req, res, next) => {
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

    res.status(201).json({
      status: "success",
      message: "User created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate tokens using the utility function
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError("User not found", 403));
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      status: "success",
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid refresh token", 403));
    }
    next(error);
  }
};

const logout = async (req, res) => {
  // For mobile clients, the token cleanup is handled on the client side
  // Server just acknowledges the logout request
  res.status(204).send();
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
