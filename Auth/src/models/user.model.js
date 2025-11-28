const mongoose = require('mongoose');


const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String, 
    zip: String,
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String ,select: false},
    fullNanme: { 
        firstName: { type: String, required: true },
        lastName: { type: String, required: true}
    }, 
    role: { type: String, enum: ['user', 'seller'], default: 'user' },
    address: [addressSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);    