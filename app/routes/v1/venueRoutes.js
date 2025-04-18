const express = require("express");
const router = express.Router();
const {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
  getGigProposals,
  hireArtist,
  confirmGigCompletion,
} = require("../../controllers/venueGigController");
const {
  createGigValidation,
  listGigsValidation,
  getGigByIdValidation,
  updateGigValidation,
  getGigProposalsValidation,
  hireArtistValidation,
  confirmGigCompletionValidation,
} = require("../../validation/venueGigValidation");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     GigCreate:
 *       type: object
 *       required:
 *         - name
 *         - date
 *         - venue
 *         - startTime
 *         - endTime
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the gig
 *           example: "Jazz Night"
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the gig (YYYY-MM-DD)
 *           example: "2025-05-15"
 *         venue:
 *           type: string
 *           description: The venue name or location
 *           example: "Blue Note Jazz Club"
 *         hourlyRate:
 *           type: number
 *           description: The hourly rate for the artist (either this or fullGigAmount should be provided)
 *           example: 75.00
 *         fullGigAmount:
 *           type: number
 *           description: The full amount for the gig (either this or hourlyRate should be provided)
 *           example: 350.00
 *         estimatedAudienceSize:
 *           type: integer
 *           description: Estimated number of audience members
 *           example: 100
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: When the gig starts (must be on the same day as date)
 *           example: "2025-05-15T19:00:00Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: When the gig ends (must be on the same day as date and after startTime)
 *           example: "2025-05-15T22:00:00Z"
 *         equipment:
 *           type: string
 *           description: Equipment information or requirements
 *           example: "PA system and basic stage setup provided. Musicians should bring their own instruments."
 *         jobDetails:
 *           type: string
 *           description: Additional details about the gig
 *           example: "Looking for a jazz quartet to play a mix of standards and originals for a restaurant opening."
 *     Gig:
 *       allOf:
 *         - $ref: '#/components/schemas/GigCreate'
 *         - type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: The auto-generated id of the gig
 *               example: 1
 *             userId:
 *               type: integer
 *               description: The id of the venue user who created the gig
 *               example: 5
 *             totalHours:
 *               type: string
 *               description: The calculated duration of the gig in HH:MM:SS format
 *               example: "03:00:00"
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: When the gig was created
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: When the gig was last updated
 *     GigListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             gigs:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gig'
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of gigs
 *                   example: 30
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 3
 *                 hasNextPage:
 *                   type: boolean
 *                   description: Whether there is a next page
 *                   example: true
 *                 hasPrevPage:
 *                   type: boolean
 *                   description: Whether there is a previous page
 *                   example: false
 *
 * /api/v1/venues/gigs:
 *   post:
 *     summary: Create a new gig (venue users only)
 *     description: Allows venue users to create a new gig listing
 *     tags:
 *       - API - V1 - Gigs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GigCreate'
 *     responses:
 *       201:
 *         description: Gig created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Gig created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     gig:
 *                       $ref: '#/components/schemas/Gig'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a venue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all gigs for the venue user
 *     description: Returns a paginated list of gigs created by the authenticated venue user. Supports search and pagination.
 *     tags:
 *       - API - V1 - Gigs
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
 *         description: List of gigs for the venue user
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
 *         description: Forbidden - User is not a venue
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
 * /api/v1/venues/gigs/{id}:
 *   get:
 *     summary: Get a gig by ID
 *     description: Returns detailed information about a specific gig. Venue users can only access their own gigs.
 *     tags:
 *       - API - V1 - Gigs
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
 *         description: Forbidden - User is not a venue
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
 *   patch:
 *     summary: Update a gig by ID
 *     description: Allows venue users to update their own gigs. All fields are optional.
 *     tags:
 *       - API - V1 - Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the gig
 *                 example: "Updated Jazz Night"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of the gig (YYYY-MM-DD)
 *                 example: "2025-06-15"
 *               venue:
 *                 type: string
 *                 description: The venue name or location
 *                 example: "Blue Note Jazz Club"
 *               hourlyRate:
 *                 type: number
 *                 description: The hourly rate for the artist (either this or fullGigAmount should be provided)
 *                 example: 85.00
 *               fullGigAmount:
 *                 type: number
 *                 description: The full amount for the gig (either this or hourlyRate should be provided)
 *                 example: 400.00
 *               estimatedAudienceSize:
 *                 type: integer
 *                 description: Estimated number of audience members
 *                 example: 150
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the gig starts (must be on the same day as date)
 *                 example: "2025-06-15T19:30:00Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the gig ends (must be on the same day as date and after startTime)
 *                 example: "2025-06-15T23:00:00Z"
 *               equipment:
 *                 type: string
 *                 description: Equipment information or requirements
 *                 example: "Updated equipment requirements"
 *               jobDetails:
 *                 type: string
 *                 description: Additional details about the gig
 *                 example: "Updated job details"
 *     responses:
 *       200:
 *         description: Gig updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Gig updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     gig:
 *                       $ref: '#/components/schemas/Gig'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a venue
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
 *   delete:
 *     summary: Delete a gig by ID
 *     description: Allows venue users to delete their own gigs.
 *     tags:
 *       - API - V1 - Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to delete
 *     responses:
 *       204:
 *         description: Gig deleted successfully (No Content)
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a venue
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
 * /api/v1/venues/gigs/{id}/proposals:
 *   get:
 *     summary: Get all proposals for a specific gig
 *     description: Returns all proposals submitted by artists for a specific gig. Only accessible by the venue that created the gig.
 *     tags:
 *       - API - V1 - Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to get proposals for
 *     responses:
 *       200:
 *         description: List of proposals for the gig
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
 *                     proposals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           gigId:
 *                             type: integer
 *                             example: 123
 *                           artistId:
 *                             type: integer
 *                             example: 456
 *                           hourlyRate:
 *                             type: number
 *                             nullable: true
 *                             example: 100
 *                           fullGigAmount:
 *                             type: number
 *                             nullable: true
 *                             example: null
 *                           coverLetter:
 *                             type: string
 *                             example: "I would love to perform at your venue..."
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a venue
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
 * /api/v1/venues/proposals/{id}/hire:
 *   post:
 *     summary: Hire an artist based on their proposal
 *     description: Allows venue owners to hire an artist by accepting their proposal. Changes the proposal status to in-progress.
 *     tags:
 *       - API - V1 - Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the proposal to accept
 *     responses:
 *       200:
 *         description: Artist hired successfully
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
 *       400:
 *         description: Bad Request - Proposal is not in pending status
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
 *         description: Forbidden - User is not a venue or doesn't own the gig
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proposal not found or gig not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/venues/gigs/{id}/confirm-completion:
 *   post:
 *     summary: Confirm gig completion and rate artist
 *     description: Allows venue owners to confirm gig completion, rate the artist's performance, and provide feedback
 *     tags:
 *       - API - V1 - Gigs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the gig to confirm completion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - tags
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating for the artist (1-5)
 *                 example: 5
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ["Professional", "Fun", "Crowd Pleaser", "Other"]
 *                 description: Tags describing the artist's performance
 *                 example: ["Professional", "Fun"]
 *               comments:
 *                 type: string
 *                 description: Additional comments about the artist's performance
 *                 example: "Great performance, very punctual and professional"
 *     responses:
 *       200:
 *         description: Completion confirmed successfully
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
 *                         status:
 *                           type: string
 *                           example: "completed"
 *                         completionRequest:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "confirmed"
 *                             confirmationCode:
 *                               type: string
 *                             locationAddress:
 *                               type: string
 *                             confirmedAt:
 *                               type: string
 *                               format: date-time
 *                             venueRating:
 *                               type: object
 *                               properties:
 *                                 rating:
 *                                   type: integer
 *                                   example: 5
 *                                 tags:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                   example: ["Professional", "Fun"]
 *                                 comments:
 *                                   type: string
 *                     artistRating:
 *                       type: object
 *                       properties:
 *                         artistId:
 *                           type: integer
 *                         averageRating:
 *                           type: number
 *                           example: 4.5
 *                         ratingCount:
 *                           type: integer
 *                           example: 10
 *                         commonTags:
 *                           type: object
 *                           example: {"Professional": 8, "Fun": 6}
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
 *         description: Forbidden - User is not a venue or doesn't own the gig
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Gig, proposal, or completion request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post("/gigs", authenticate, createGigValidation, validate, createGig);
router.get("/gigs", authenticate, listGigsValidation, validate, getAllGigs);
router.get(
  "/gigs/:id",
  authenticate,
  getGigByIdValidation,
  validate,
  getGigById
);
router.get(
  "/gigs/:id/proposals",
  authenticate,
  getGigProposalsValidation,
  validate,
  getGigProposals
);
router.patch(
  "/gigs/:id",
  authenticate,
  updateGigValidation,
  validate,
  updateGig
);
router.delete(
  "/gigs/:id",
  authenticate,
  getGigByIdValidation,
  validate,
  deleteGig
);
router.post(
  "/proposals/:id/hire",
  authenticate,
  hireArtistValidation,
  validate,
  hireArtist
);
router.post(
  "/gigs/:id/confirm-completion",
  authenticate,
  confirmGigCompletionValidation,
  validate,
  confirmGigCompletion
);

module.exports = router;
