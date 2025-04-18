const { User, Gig } = require("../models");
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");
const {
  gigProposals,
  artistRatings,
  getOrCreateArtistRating,
  updateArtistRatingStats,
} = require("./artistGigController");

const createGig = async (req, res, next) => {
  try {
    // Create the gig
    const gigData = {
      userId: req.user.id,
      name: req.body.name,
      date: req.body.date,
      venue: req.body.venue,
      hourlyRate: req.body.hourlyRate || null,
      fullGigAmount: req.body.fullGigAmount || null,
      estimatedAudienceSize: req.body.estimatedAudienceSize || null,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      equipment: req.body.equipment || null,
      jobDetails: req.body.jobDetails || null,
    };

    // Create gig with error handling similar to profileController
    const gig = await Gig.create(gigData).catch((error) => {
      throw new AppError(error.message, 400);
    });

    res.status(201).json({
      status: "success",
      message: "Gig created successfully",
      data: {
        gig: gig.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllGigs = async (req, res, next) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get search term if provided
    const search = req.query.search || "";

    // Build query options
    const queryOptions = {
      where: {
        userId: req.user.id, // Ensure venues can only see their own gigs
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    };

    // Add search condition if search term is provided
    if (search) {
      queryOptions.where.name = {
        [Op.iLike]: `%${search}%`, // Case-insensitive search
      };
    }

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(
        new AppError("Only venue users can access gig listings", 403)
      );
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

const getGigById = async (req, res, next) => {
  try {
    const gigId = req.params.id;

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(new AppError("Only venue users can access gigs", 403));
    }

    // Find the gig with the provided ID
    const gig = await Gig.findOne({
      where: {
        id: gigId,
        userId: req.user.id, // Ensure venues can only see their own gigs
      },
    });

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

const updateGig = async (req, res, next) => {
  try {
    const gigId = req.params.id;

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(new AppError("Only venue users can update gigs", 403));
    }

    // Find the gig ensuring it belongs to the venue user
    const gig = await Gig.findOne({
      where: {
        id: gigId,
        userId: req.user.id, // Ensure venues can only update their own gigs
      },
    });

    if (!gig) {
      return next(new AppError("Gig not found", 404));
    }

    // Prepare update data
    const updateData = {
      name: req.body.name || gig.name,
      date: req.body.date || gig.date,
      venue: req.body.venue || gig.venue,
      hourlyRate:
        req.body.hourlyRate === undefined
          ? gig.hourlyRate
          : req.body.hourlyRate,
      fullGigAmount:
        req.body.fullGigAmount === undefined
          ? gig.fullGigAmount
          : req.body.fullGigAmount,
      estimatedAudienceSize:
        req.body.estimatedAudienceSize === undefined
          ? gig.estimatedAudienceSize
          : req.body.estimatedAudienceSize,
      startTime: req.body.startTime || gig.startTime,
      endTime: req.body.endTime || gig.endTime,
      equipment:
        req.body.equipment === undefined ? gig.equipment : req.body.equipment,
      jobDetails:
        req.body.jobDetails === undefined
          ? gig.jobDetails
          : req.body.jobDetails,
    };

    // Update the gig with error handling
    await gig.update(updateData).catch((error) => {
      throw new AppError(error.message, 400);
    });

    res.json({
      status: "success",
      message: "Gig updated successfully",
      data: {
        gig: gig.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteGig = async (req, res, next) => {
  try {
    const gigId = req.params.id;

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(new AppError("Only venue users can delete gigs", 403));
    }

    // Find the gig ensuring it belongs to the venue user
    const gig = await Gig.findOne({
      where: {
        id: gigId,
        userId: req.user.id, // Ensure venues can only delete their own gigs
      },
    });

    if (!gig) {
      return next(new AppError("Gig not found", 404));
    }

    // Delete the gig
    await gig.destroy();

    // Return success with no content
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getGigProposals = async (req, res, next) => {
  try {
    const gigId = parseInt(req.params.id);

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(new AppError("Only venue users can view gig proposals", 403));
    }

    // Find the gig ensuring it belongs to the venue user
    const gig = await Gig.findOne({
      where: {
        id: gigId,
        userId: req.user.id,
      },
    });

    if (!gig) {
      return next(new AppError("Gig not found", 404));
    }

    // Filter proposals for this gig
    const proposals = gigProposals.filter(
      (proposal) => proposal.gigId === gigId
    );

    res.json({
      status: "success",
      data: {
        proposals,
      },
    });
  } catch (error) {
    next(error);
  }
};

const hireArtist = async (req, res, next) => {
  try {
    const proposalId = parseInt(req.params.id);

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(new AppError("Only venue users can hire artists", 403));
    }

    // Find the proposal
    const proposal = gigProposals.find((p) => p.id === proposalId);
    if (!proposal) {
      return next(new AppError("Proposal not found", 404));
    }

    // Find the gig to verify ownership
    const gig = await Gig.findOne({
      where: {
        id: proposal.gigId,
        userId: req.user.id, // Ensure venue owns the gig
      },
    });

    if (!gig) {
      return next(
        new AppError("Gig not found or you don't have permission", 404)
      );
    }

    if (proposal.status !== "pending") {
      return next(new AppError("This proposal is no longer pending", 400));
    }

    // Update proposal status
    proposal.status = "in-progress";
    proposal.hiredAt = new Date();

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

const confirmGigCompletion = async (req, res, next) => {
  try {
    const gigId = parseInt(req.params.id);
    const venueId = req.user.id;

    // Get user to verify they are a venue
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.userType !== "venue") {
      return next(
        new AppError("Only venue users can confirm gig completion", 403)
      );
    }

    // Find the gig to verify ownership
    const gig = await Gig.findOne({
      where: {
        id: gigId,
        userId: venueId,
      },
    });

    if (!gig) {
      return next(
        new AppError("Gig not found or you don't have permission", 404)
      );
    }

    // Find the proposal with completion request
    const proposal = gigProposals.find((p) => p.gigId === gigId);
    if (!proposal) {
      return next(new AppError("No proposal found for this gig", 404));
    }

    if (!proposal.completionRequest) {
      return next(
        new AppError("No completion request found for this gig", 404)
      );
    }

    if (proposal.completionRequest.status !== "pending") {
      return next(
        new AppError("Completion request is not in pending status", 400)
      );
    }

    // Update proposal and completion request status
    proposal.status = "completed";
    proposal.completionRequest.status = "confirmed";
    proposal.completionRequest.confirmedAt = new Date();
    proposal.completionRequest.confirmedBy = venueId;
    proposal.completionRequest.venueRating = {
      rating: req.body.rating,
      tags: req.body.tags,
      comments: req.body.comments || "",
      ratedBy: venueId,
    };

    // Add rating to artist's ratings
    const artistRating = getOrCreateArtistRating(proposal.artistId);
    artistRating.ratings.push({
      gigId,
      proposalId: proposal.id,
      venueId,
      venueName: user.name,
      rating: req.body.rating,
      tags: req.body.tags,
      comments: req.body.comments || "",
      ratedAt: new Date(),
    });

    // Update artist rating statistics
    updateArtistRatingStats(artistRating);

    res.json({
      status: "success",
      data: {
        proposal,
        artistRating: {
          artistId: proposal.artistId,
          averageRating: artistRating.averageRating,
          ratingCount: artistRating.ratingCount,
          commonTags: artistRating.commonTags,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
  getGigProposals,
  hireArtist,
  confirmGigCompletion,
};
