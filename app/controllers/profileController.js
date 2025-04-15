const { User } = require("../models");
const AppError = require("../utils/AppError");

const getProfile = async (req, res, next) => {
  try {
    // Get user data from database to ensure it's up to date
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile
};