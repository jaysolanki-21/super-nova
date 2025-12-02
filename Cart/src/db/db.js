const mongoose = require('mongoose');

async function connectDB() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cartdb';
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDB;