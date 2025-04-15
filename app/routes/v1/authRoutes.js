const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
} = require("../../controllers/userController");
const {
  registerUserValidation,
  loginValidation,
  refreshTokenValidation,
} = require("../../validation/userValidation");
const validate = require("../../middleware/validate");

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Login successful
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               description: JWT access token valid for 15 minutes
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             refreshToken:
 *               type: string
 *               description: JWT refresh token valid for 7 days. Store securely on the mobile device.
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: The refresh token previously obtained during login
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     RefreshTokenResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               description: New JWT access token valid for 15 minutes
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/schemas/Error'
 *
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password (Mobile)
 *     description: |
 *       Mobile authentication endpoint that returns both access and refresh tokens in the response body.
 *       - Access token should be included in subsequent API requests in the Authorization header
 *       - Refresh token should be securely stored on the device and used to obtain new access tokens
 *     operationId: loginUser
 *     tags:
 *       - API - V1 - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 *
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Get new access token (Mobile)
 *     description: |
 *       Mobile endpoint to obtain a new access token using a refresh token.
 *       The refresh token should be sent in the request body.
 *     operationId: refreshToken
 *     tags:
 *       - API - V1 - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: No refresh token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout (Mobile)
 *     description: |
 *       Mobile endpoint to logout. The client should:
 *       1. Remove the stored refresh token
 *       2. Remove the stored access token
 *       3. Call this endpoint to notify the server (optional)
 *     operationId: logoutUser
 *     tags:
 *       - API - V1 - Auth
 *     responses:
 *       204:
 *         description: Successfully logged out
 */

router.post("/register", registerUserValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/refresh", refreshTokenValidation, validate, refresh);
router.post("/logout", logout);

module.exports = router;
