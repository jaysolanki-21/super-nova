const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
    // Accept token from Authorization header (Bearer) or from cookie
    let token = null;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.jwtSecret);
        const user = await userModel.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();  
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });   
    }
}

module.exports = authMiddleware;