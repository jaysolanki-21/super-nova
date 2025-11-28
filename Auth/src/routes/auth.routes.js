const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, logoutUser, getUserAddresses, addUserAddress, deleteUserAddresses } = require('../controllers/auth.controller');
const { registerValidation, runValidation, loginValidation, addUserAddressValidation } = require('../middleware/validator.middleware');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', registerValidation, runValidation, register);
router.post('/login', loginValidation, runValidation, login);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/logout', logoutUser); 
router.get('/users/me/addresses', authMiddleware, getUserAddresses); 
router.post('/users/me/addresses', addUserAddressValidation, runValidation, authMiddleware, addUserAddress);
router.delete('/users/me/addresses', authMiddleware, deleteUserAddresses);
module.exports = router;
