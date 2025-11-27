const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, logoutUser } = require('../controllers/auth.controller');
const { registerValidation, runValidation, loginValidation } = require('../middleware/validator.middleware');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', registerValidation, runValidation, register);
router.post('/login', loginValidation, runValidation, login);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/logout', logoutUser); 
module.exports = router;
