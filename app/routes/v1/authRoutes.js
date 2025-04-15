const express = require("express");
const router = express.Router();
const { register } = require("../../controllers/userController");
const { registerUserValidation } = require("../../validation/userValidation");
const validate = require("../../validation/middleware/validate");

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     operationId: registerUser
 *     tags:
 *       - API - V1 - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirm_password
 *               - userType
 *               - agreeTermsAndConditions
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               confirm_password:
 *                 type: string
 *                 example: password123
 *               userType:
 *                 type: string
 *                 enum: [artist, venue]
 *                 example: artist
 *               agreeTermsAndConditions:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post("/register", registerUserValidation, validate, register);

module.exports = router;
