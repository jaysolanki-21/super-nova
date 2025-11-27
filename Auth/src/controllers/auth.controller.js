const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

async function register(req, res) {
    try {
        const { username, email, password, fullName: { firstName, lastName } } = req.body;
        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashed,
            fullNanme: { firstName, lastName }
        });

        await newUser.save();
        const token = jwt.sign({ id: newUser._id, username: newUser.username, role: newUser.role }, process.env.jwtSecret, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, MaxAge: 24 * 60 * 60 * 1000, secure: true });
        res.status(201).json({ message: 'User registered successfully', user: { username: newUser.username, email: newUser.email, fullName: newUser.fullNanme, role: newUser.role } });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
}

async function login(req, res) {
    try {
        const { username, email, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { email }] }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.jwtSecret, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: true });
        res.status(200).json({ message: 'Login successful', user: { username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user' });
    }
}

async function getCurrentUser(req, res) {
    try {
        return res.status(200).json({ message: 'User details fetched successfully', user: req.user });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Error fetching user details' });
    }
}

async function logoutUser(req, res) {
    try {
        const token = req.cookies?.token;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.jwtSecret);
                const exp = decoded.exp;
                const ttl = exp - Math.floor(Date.now() / 1000);
                if (redis && redis.set) {
                    await redis.set(`blacklist:${token}`, 'true', 'EX', ttl);
                }
            } catch (err) {
                console.warn("Token invalid during logout (ignored):", err.message);
            }
        }
        res.cookie("token", "", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            expires: new Date(0)   
        });

        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(200).json({ message: "Logout successful" });
    }
}


module.exports = { register, login, getCurrentUser, logoutUser };
