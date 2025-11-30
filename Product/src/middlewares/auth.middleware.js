const jwt = require('jsonwebtoken');

function createAuthMiddleware( roles = ['user']) {
    return function authMiddleware(req, res, next) {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing' });
        }

        try {
            const decoded = jwt.verify(token, process.env.jwtSecret);
            if (!roles.includes(decoded.role)) {
                console.log(decoded);
                return res.status(403).json({ message: 'Forbidden' });
            }
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
}

module.exports = { createAuthMiddleware };