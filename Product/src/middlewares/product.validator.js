const { body, validationResult } = require('express-validator');

const createProductValidation = [
  body('title').isString().isLength({ min: 3 }).withMessage('title must be at least 3 chars'),
  body('priceAmount')
    .exists()
    .withMessage('priceAmount is required')
    .bail()
    .isFloat({ gt: 0 })
    .withMessage('priceAmount must be a number greater than 0'),
  body('priceCurrency')
    .optional()
    .isIn(['USD', 'INR'])
    .withMessage('priceCurrency must be one of USD or INR'),
];

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { createProductValidation, runValidation };
