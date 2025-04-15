const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateArtistProfile,
} = require("../../controllers/profileController");
const {
  updateArtistProfileValidation,
} = require("../../validation/artistProfileValidation");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         userType:
 *           type: string
 *           enum: [artist, venue]
 *           description: The type of user account
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ArtistProfileUpdate:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - skill
 *         - stageName
 *         - accountHolderName
 *         - bsb
 *         - accountNumber
 *         - abn
 *         - links
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: "1234567890"
 *         skill:
 *           type: string
 *           example: "Guitarist"
 *         bio:
 *           type: string
 *           example: "Experienced stage performer"
 *         stageName:
 *           type: string
 *           example: "DJ Blaze"
 *         accountHolderName:
 *           type: string
 *           example: "John Doe"
 *         bsb:
 *           type: string
 *           example: "123456"
 *         accountNumber:
 *           type: string
 *           example: "987654321"
 *         abn:
 *           type: string
 *           example: "12345678901"
 *         links:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - platform
 *               - url
 *             properties:
 *               platform:
 *                 type: string
 *                 example: "YouTube"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://youtube.com/example"
 *
 * /api/v1/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     description: Retrieves the profile of the currently authenticated user
 *     tags:
 *       - API - V1 - Profile
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - No token provided or invalid token
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
 *   put:
 *     summary: Update artist profile
 *     description: Update or create the authenticated artist's profile and associated links
 *     tags:
 *       - API - V1 - Profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArtistProfileUpdate'
 *     responses:
 *       200:
 *         description: Artist profile updated successfully
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
 *                   example: Artist profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       properties:
 *                         phoneNumber:
 *                           type: string
 *                         skill:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         stageName:
 *                           type: string
 *                         accountHolderName:
 *                           type: string
 *                         bsb:
 *                           type: string
 *                         accountNumber:
 *                           type: string
 *                         abn:
 *                           type: string
 *                     links:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           platform:
 *                             type: string
 *                           url:
 *                             type: string
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
 */

router.get("/", authenticate, getProfile);
router.put(
  "/",
  authenticate,
  updateArtistProfileValidation,
  validate,
  updateArtistProfile
);

module.exports = router;
