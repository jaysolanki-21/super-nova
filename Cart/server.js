require('dotenv').config();
const connectDB = require('./src/db/db');
const app = require('./src/app');

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
   connectDB();
  console.log(`Cart service is running on port ${PORT}`);
});