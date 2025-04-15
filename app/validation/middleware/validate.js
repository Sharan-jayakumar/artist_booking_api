/**
 * @swagger
 * components:
 *   schemas:
 *     ValidationError:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 */

const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
        field: error.path,
        message: error.msg
    }));

    // Create an AppError instance with validation errors in the desired format
    const error = new AppError('Validation Error', 400);
    error.errors = formattedErrors;

    next(error);
};

module.exports = validate;