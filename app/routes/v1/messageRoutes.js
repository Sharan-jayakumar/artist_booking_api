const express = require("express");
const router = express.Router();
const {
  getMessages,
  createMessage,
} = require("../../controllers/messageController");
const {
  getMessagesValidation,
  createMessageValidation,
} = require("../../validation/messageValidation");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/auth");

/**
 * @swagger
 * /api/v1/proposals/{id}/messages:
 *   get:
 *     summary: Get messages for a proposal
 *     description: Retrieve all messages for a specific proposal. Only accessible by the artist who made the proposal and the venue owner.
 *     tags:
 *       - API - V1 - Messages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the proposal to get messages for
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
 *           default: 20
 *         description: Number of items per page (max 100)
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           proposalId:
 *                             type: integer
 *                             example: 123
 *                           senderId:
 *                             type: integer
 *                             example: 456
 *                           senderType:
 *                             type: string
 *                             enum: [artist, venue]
 *                             example: "artist"
 *                           message:
 *                             type: string
 *                             example: "What time should I arrive for setup?"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of messages
 *                           example: 30
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           description: Number of items per page
 *                           example: 20
 *                         totalPages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 2
 *                         hasNextPage:
 *                           type: boolean
 *                           description: Whether there is a next page
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           description: Whether there is a previous page
 *                           example: false
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       403:
 *         description: Forbidden - User is not involved in the proposal
 *       404:
 *         description: Proposal not found
 *
 *   post:
 *     summary: Create a new message
 *     description: Send a new message in a proposal conversation. Only accessible by the artist who made the proposal and the venue owner.
 *     tags:
 *       - API - V1 - Messages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the proposal to add message to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content
 *                 example: "What time should I arrive for setup?"
 *     responses:
 *       201:
 *         description: Message created successfully
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
 *                     message:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         proposalId:
 *                           type: integer
 *                           example: 123
 *                         senderId:
 *                           type: integer
 *                           example: 456
 *                         senderType:
 *                           type: string
 *                           enum: [artist, venue]
 *                           example: "artist"
 *                         message:
 *                           type: string
 *                           example: "What time should I arrive for setup?"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad Request - Invalid message content
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       403:
 *         description: Forbidden - User is not involved in the proposal
 *       404:
 *         description: Proposal not found
 */

router.get(
  "/:id/messages",
  authenticate,
  getMessagesValidation,
  validate,
  getMessages
);

router.post(
  "/:id/messages",
  authenticate,
  createMessageValidation,
  validate,
  createMessage
);

module.exports = router;
