const { User, Gig } = require("../models");
const AppError = require("../utils/AppError");
const { gigProposals } = require("./artistGigController");

// In-memory message storage
const messages = [];
let nextMessageId = 1;

/**
 * Get messages for a proposal with pagination
 */
const getMessages = async (req, res, next) => {
  try {
    const proposalId = parseInt(req.params.id);
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Find proposal
    const proposal = gigProposals.find((p) => p.id === proposalId);
    if (!proposal) {
      return next(new AppError("Proposal not found", 404));
    }

    // Get the gig to verify ownership
    const gig = await Gig.findByPk(proposal.gigId);
    if (!gig) {
      return next(new AppError("Gig not found", 404));
    }

    // Get user to determine type
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if user is either the artist or venue owner
    if (userId !== proposal.artistId && userId !== gig.userId) {
      return next(
        new AppError("You don't have permission to view these messages", 403)
      );
    }

    // Get messages for this proposal, ordered by createdAt descending
    const proposalMessages = messages
      .filter((m) => m.proposalId === proposalId)
      .sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const paginatedMessages = proposalMessages.slice(offset, offset + limit);
    const total = proposalMessages.length;
    const totalPages = Math.ceil(total / limit);

    res.json({
      status: "success",
      data: {
        messages: paginatedMessages,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new message for a proposal
 */
const createMessage = async (req, res, next) => {
  try {
    const proposalId = parseInt(req.params.id);
    const userId = req.user.id;
    const message = req.body.message;

    // Find proposal
    const proposal = gigProposals.find((p) => p.id === proposalId);
    if (!proposal) {
      return next(new AppError("Proposal not found", 404));
    }

    // Get the gig to verify ownership
    const gig = await Gig.findByPk(proposal.gigId);
    if (!gig) {
      return next(new AppError("Gig not found", 404));
    }

    // Get user to determine type
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if user is either the artist or venue owner
    if (userId !== proposal.artistId && userId !== gig.userId) {
      return next(
        new AppError("You don't have permission to send messages", 403)
      );
    }

    // Create new message
    const newMessage = {
      id: nextMessageId++,
      proposalId,
      senderId: userId,
      senderType: user.userType,
      message,
      createdAt: new Date(),
    };

    messages.push(newMessage);

    res.status(201).json({
      status: "success",
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  messages, // Export for testing
  getMessages,
  createMessage,
};
