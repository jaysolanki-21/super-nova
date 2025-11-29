require('dotenv').config();
const app = require('./src/app');
const {connectDB} = require('./src/db/db');

 


app.listen(3000, () => {
  connectDB();
  console.log('Auth Service... ✅');
  console.log('Server is running on port 3000');
});
