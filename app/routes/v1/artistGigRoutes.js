// filepath: /Users/sharan.jayakumar/Downloads/artist_booking_api/app/routes/v1/artistGigRoutes.js
const express = require("express");
const router = express.Router();
const {
  listGigsForArtist,
  getGigByIdForArtist,
} = require("../../controllers/artistGigController");
const {
  listGigsValidation,
  getGigByIdValidation,
} = require("../../validation/gigValidation");
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

module.exports = router;
