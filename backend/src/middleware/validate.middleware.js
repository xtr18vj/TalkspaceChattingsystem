const { validationResult, body, param, query } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validations
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation
];

// Message validations
const validateSendMessage = [
  body('conversationId')
    .optional()
    .isMongoId().withMessage('Invalid conversation ID'),
  body('recipientId')
    .optional()
    .isMongoId().withMessage('Invalid recipient ID'),
  body('text')
    .optional()
    .isString().withMessage('Text must be a string')
    .isLength({ max: 5000 }).withMessage('Message cannot exceed 5000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'voice', 'video', 'location', 'contact'])
    .withMessage('Invalid message type'),
  handleValidation
];

// Group validations
const validateCreateGroup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Group name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('members')
    .isArray({ min: 1 }).withMessage('At least one member is required')
    .custom((members) => {
      if (!members.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('Invalid member ID format');
      }
      return true;
    }),
  handleValidation
];

// User validations
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-+()]*$/).withMessage('Invalid phone number format'),
  handleValidation
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidation
];

// MongoDB ID validation
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidation
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validateSendMessage,
  validateCreateGroup,
  validateUpdateProfile,
  validateChangePassword,
  validateMongoId
};
