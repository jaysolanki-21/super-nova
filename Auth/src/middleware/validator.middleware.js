const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('username').isString().isLength({ min: 3 }).withMessage('username must be at least 3 chars'),
  body('email').isEmail().withMessage('valid email required'),
  body('password').isLength({ min: 6 }).withMessage('password min length 6'),
  body().custom((value) => {
    const f = value.fullName || value.fullNanme;
    if (!f || !f.firstName || !f.lastName) {
      throw new Error('fullName.firstName and fullName.lastName are required');
    }
    return true;
  }),
];

const loginValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),

  body('username')
    .optional()
    .isString()
    .withMessage('Username must be a string'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body().custom((value) => {
    if (!value.email && !value.username) {
      throw new Error('Email or Username is required');
    }
    return true;
  }),
];


function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const addUserAddressValidation = [
  body('street').isString().withMessage('Street is required').notEmpty().withMessage('Street cannot be empty'),
  body('city').isString().withMessage('City is required').notEmpty().withMessage('City cannot be empty'),
  body('state').isString().withMessage('State is required').notEmpty().withMessage('State cannot be empty'),
  body('country').isString().withMessage('Country is required').notEmpty().withMessage('Country cannot be empty'),
  body('zip').isString().withMessage('Zip code is required').notEmpty().withMessage('Zip code cannot be empty'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

module.exports = { registerValidation, runValidation, loginValidation, addUserAddressValidation };
