const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(express.json());

// Import cart routes
const cartRoutes = require('./routes/cart.routes');
app.use('/api/cart', cartRoutes);

module.exports = app;