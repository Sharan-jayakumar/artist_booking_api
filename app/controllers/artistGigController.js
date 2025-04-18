const { User, Gig } = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");

// Store gig proposals
const gigProposals = [];

// Store artist ratings
const artistRatings = [];

// Helper function to get or create artist rating record
const getOrCreateArtistRating = (artistId) => {
  let artistRating = artistRatings.find((ar) => ar.artistId === artistId);
  if (!artistRating) {
    artistRating = {
      artistId,
      ratings: [],
      averageRating: 0,
      ratingCount: 0,
      commonTags: {},
    };
    artistRatings.push(artistRating);
  }
  return artistRating;
};

// Helper function to update artist rating statistics
const updateArtistRatingStats = (artistRating) => {
  const totalRating = artistRating.ratings.reduce(
    (sum, r) => sum + r.rating,
    0
  );
  artistRating.averageRating = totalRating / artistRating.ratings.length;
  artistRating.ratingCount = artistRating.ratings.length;

  // Reset and recalculate tag frequencies
  artistRating.commonTags = {};
  artistRating.ratings.forEach((rating) => {
    rating.tags.forEach((tag) => {
      artistRating.commonTags[tag] = (artistRating.commonTags[tag] || 0) + 1;
    });
  });
};

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

// Create a proposal for a gig
const createGigProposal = async (req, res, next) => {
  try {
    const gigId = parseInt(req.params.id);
    const artistId = req.user.id;

    // Get user to verify they are an artist
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "artist") {
      return next(new AppError("Only artist users can create proposal", 403));
    }

    // Create the proposal object
    const proposal = {
      id: gigProposals.length + 1,
      gigId,
      artistId,
      hourlyRate: req.body.hourlyRate || null,
      fullGigAmount: req.body.fullGigAmount || null,
      coverLetter: req.body.coverLetter,
      status: "pending",
      createdAt: new Date(),
      hiredAt: null,
    };

    // Add to our in-memory array
    gigProposals.push(proposal);

    res.status(201).json({
      status: "success",
      data: {
        proposal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const requestGigCompletion = async (req, res, next) => {
  try {
    const gigId = parseInt(req.params.id);
    const artistId = req.user.id;

    // Get user to verify they are an artist
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "artist") {
      return next(
        new AppError("Only artist users can request gig completion", 403)
      );
    }

    // Find the proposal for this gig and artist
    const proposal = gigProposals.find(
      (p) => p.gigId === gigId && p.artistId === artistId
    );

    if (!proposal) {
      return next(new AppError("No proposal found for this gig", 404));
    }

    if (proposal.status !== "in-progress") {
      return next(
        new AppError("Can only request completion for in-progress gigs", 400)
      );
    }

    // Add completion request to the proposal
    proposal.completionRequest = {
      requestedAt: new Date(),
      confirmationCode: req.body.confirmationCode,
      locationAddress: req.body.locationAddress,
      status: "pending",
    };

    res.json({
      status: "success",
      data: {
        proposal,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listGigsForArtist,
  getGigByIdForArtist,
  createGigProposal,
  requestGigCompletion,
  gigProposals, // Export for use in venueGigController
  artistRatings, // Export for use in venueGigController
  getOrCreateArtistRating,
  updateArtistRatingStats,
};
