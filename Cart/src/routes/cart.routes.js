const express = require('express');
const { createAuthMiddleware } = require('../middlewares/auth.middleware');
const { addItemToCart, getCartItems, removeItemFromCart, clearCart, updateItemQuantity } = require('../controllers/cart.controller');
const router = express.Router();
const validation = require('../middlewares/validation.middleware');

// Get cart items

router.post('/items',validation.validateAddItemToCart, createAuthMiddleware(['user']),  addItemToCart);
router.get('/', createAuthMiddleware(['user']), getCartItems);
router.delete('/items/:productId', createAuthMiddleware(['user']), removeItemFromCart);
router.delete('/clear', createAuthMiddleware(['user']), clearCart);
router.patch('/items/:productId',validation.validateUpdateCartItem, createAuthMiddleware(['user']),  updateItemQuantity);



module.exports = router;