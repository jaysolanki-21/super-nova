const express = require('express');
const router = express.Router();
const { createAuthMiddleware } = require('../middlewares/auth.middleware');
const { createProduct } = require('../controllers/post.controller');
const multer = require('multer');
const upload = multer();
const { createProductValidation, runValidation } = require('../middlewares/product.validator');

router.post(
	'/',
	createAuthMiddleware(['admin', 'seller']),
	upload.array('images', 5),
	createProductValidation,
	runValidation,
	createProduct
);

router.get('/', getProducts);

module.exports = router;