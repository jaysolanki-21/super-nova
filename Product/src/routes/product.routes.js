const express = require('express');
const router = express.Router();
const { createAuthMiddleware } = require('../middlewares/auth.middleware');
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getSellerProducts } = require('../controllers/product.controller');
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

router.patch('/:id', createAuthMiddleware(['seller']),updateProduct);

router.delete('/:id', createAuthMiddleware(['seller']), deleteProduct);

router.get('/seller', createAuthMiddleware(['seller']), getSellerProducts);

router.get('/:id', getProductById);

module.exports = router;