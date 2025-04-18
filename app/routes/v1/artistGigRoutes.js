// filepath: /Users/sharan.jayakumar/Downloads/artist_booking_api/app/routes/v1/artistGigRoutes.js
const express = require("express");
const router = express.Router();
const {
  listGigsForArtist,
  getGigByIdForArtist,
  createGigProposal,
  requestGigCompletion,
} = require("../../controllers/artistGigController");
const {
  listGigsValidation,
  getGigByIdValidation,
  createGigProposalValidation,
  requestGigCompletionValidation,
} = require("../../validation/artistGigValidation");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/auth");

/**
 * @swagger
 * /api/v1/artists/gigs:
 *   get:
 *     summary: Get all available gigs
 *     description: Returns a paginated list of all gigs available for artists to view. Supports search and pagination.
 *     tags:
 *       - API - V1 - Artist Gigs
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter gigs by name
 *     responses:
 *       200:
 *         description: List of gigs for artists to view
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GigListResponse'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not an artist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/artists/gigs/{id}:
 *   get:
 *     summary: Get a gig by ID
 *     description: Returns detailed information about a specific gig for an artist to view
 *     tags:
 *       - API - V1 - Artist Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to retrieve
 *     responses:
 *       200:
 *         description: Gig details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     gig:
 *                       $ref: '#/components/schemas/Gig'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not an artist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Gig not found or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/artists/gigs/{id}/proposal:
 *   post:
 *     summary: Submit a proposal for a gig
 *     description: Artists can submit their proposal for a specific gig with either hourly rate or full gig amount
 *     tags:
 *       - API - V1 - Artist Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to submit proposal for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GigProposalRequest'
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         gigId:
 *                           type: integer
 *                           example: 123
 *                         artistId:
 *                           type: integer
 *                           example: 456
 *                         hourlyRate:
 *                           type: number
 *                           nullable: true
 *                           example: 100
 *                         fullGigAmount:
 *                           type: number
 *                           nullable: true
 *                           example: null
 *                         coverLetter:
 *                           type: string
 *                           example: "I would love to perform at your venue..."
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not an artist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Gig not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/artists/gigs/{id}/request-completion:
 *   post:
 *     summary: Request completion of a gig
 *     description: Allows artists to submit a completion request for a gig they were hired for
 *     tags:
 *       - API - V1 - Artist Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to request completion for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmationCode
 *               - locationAddress
 *             properties:
 *               confirmationCode:
 *                 type: string
 *                 description: The confirmation code for the gig
 *                 example: "GIG123"
 *               locationAddress:
 *                 type: string
 *                 description: The address where the gig was performed
 *                 example: "123 Main St, City, Country"
 *     responses:
 *       200:
 *         description: Completion request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     proposal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         gigId:
 *                           type: integer
 *                           example: 123
 *                         artistId:
 *                           type: integer
 *                           example: 456
 *                         hourlyRate:
 *                           type: number
 *                           nullable: true
 *                           example: 100
 *                         fullGigAmount:
 *                           type: number
 *                           nullable: true
 *                           example: null
 *                         coverLetter:
 *                           type: string
 *                           example: "I would love to perform at your venue..."
 *                         status:
 *                           type: string
 *                           example: "in-progress"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         hiredAt:
 *                           type: string
 *                           format: date-time
 *                         completionRequest:
 *                           type: object
 *                           properties:
 *                             requestedAt:
 *                               type: string
 *                               format: date-time
 *                             confirmationCode:
 *                               type: string
 *                               example: "GIG123"
 *                             locationAddress:
 *                               type: string
 *                               example: "123 Main St, City, Country"
 *                             status:
 *                               type: string
 *                               example: "pending"
 *       400:
 *         description: Bad Request - Invalid input or gig not in correct status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not an artist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proposal not found or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GigProposalRequest:
 *       type: object
 *       properties:
 *         hourlyRate:
 *           type: number
 *           description: The hourly rate for the gig (either this or fullGigAmount must be provided)
 *           example: 100
 *         fullGigAmount:
 *           type: number
 *           description: The full amount for the gig (either this or hourlyRate must be provided)
 *           example: 500
 *         coverLetter:
 *           type: string
 *           description: Cover letter or proposal description
 *           example: "I would love to perform at your venue. I have 5 years of experience..."
 *       oneOf:
 *         - required: [hourlyRate, coverLetter]
 *         - required: [fullGigAmount, coverLetter]
 */

router.get(
  "/gigs",
  authenticate,
  listGigsValidation,
  validate,
  listGigsForArtist
);
router.get(
  "/gigs/:id",
  authenticate,
  getGigByIdValidation,
  validate,
  getGigByIdForArtist
);
router.post(
  "/gigs/:id/proposal",
  authenticate,
  createGigProposalValidation,
  validate,
  createGigProposal
);
router.post(
  "/gigs/:id/request-completion",
  authenticate,
  requestGigCompletionValidation,
  validate,
  requestGigCompletion
);

module.exports = router;
