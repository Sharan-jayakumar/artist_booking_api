const { User, ArtistProfile, ArtistLink } = require("../models");
const AppError = require("../utils/AppError");

const getProfile = async (req, res, next) => {
  try {
    // Get user data from database to ensure it's up to date
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.json({
      status: "success",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateArtistProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    const { links, ...profileData } = req.body;

    // Update or create artist profile
    const [profile, created] = await ArtistProfile.findOrCreate({
      where: { userId: user.id },
      defaults: profileData,
    }).catch((error) => {
      // Handle model validation errors
      if (
        error.message === "Only artists can create or update artist profiles"
      ) {
        throw new AppError(error.message, 403);
      }
      throw error;
    });

    if (!created) {
      await profile.update(profileData).catch((error) => {
        if (
          error.message === "Only artists can create or update artist profiles"
        ) {
          throw new AppError(error.message, 403);
        }
        throw error;
      });
    }

    // Delete existing links and create new ones
    await ArtistLink.destroy({
      where: { artistProfileId: profile.id },
    });

    const newLinks = await ArtistLink.bulkCreate(
      links.map((link) => ({
        ...link,
        artistProfileId: profile.id,
      }))
    );

    res.json({
      status: "success",
      message: "Artist profile updated successfully",
      data: {
        profile: profile.toJSON(),
        links: newLinks.map((link) => link.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateArtistProfile,
};
