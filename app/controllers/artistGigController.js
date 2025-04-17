const { User, Gig } = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");

/**
 * List all gigs for artists with pagination and search capabilities
 */
const listGigsForArtist = async (req, res, next) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get search term if provided
    const search = req.query.search || "";

    // Get user to verify they are an artist
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "artist") {
      return next(new AppError("Only artist users can view gig listings", 403));
    }

    // Build query options
    const queryOptions = {
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    };

    // Add search condition if search term is provided
    if (search) {
      queryOptions.where = {
        name: {
          [Op.iLike]: `%${search}%`, // Case-insensitive search
        },
      };
    }

    // Get gigs with pagination and count
    const { count, rows: gigs } = await Gig.findAndCountAll(queryOptions);

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      status: "success",
      data: {
        gigs: gigs.map((gig) => gig.toJSON()),
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific gig by ID for an artist
 */
const getGigByIdForArtist = async (req, res, next) => {
  try {
    const gigId = req.params.id;

    // Get user to verify they are an artist
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "artist") {
      return next(new AppError("Only artist users can view gigs", 403));
    }

    // Find the gig with the provided ID
    const gig = await Gig.findByPk(gigId);

    if (!gig) {
      return next(new AppError("Gig not found", 404));
    }

    res.json({
      status: "success",
      data: {
        gig: gig.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listGigsForArtist,
  getGigByIdForArtist,
};
