const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');

const productRoutes = require('./routes/product.routes');

app.use(cors({
  origin: 'http://localhost:5173', // adjust as needed for your frontend
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/products', productRoutes);
module.exports = app;