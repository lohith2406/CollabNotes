const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Note Route
app.use('/api/notes', require('./routes/noteRoutes'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
})
.catch(err => console.log(err));

// // WARNING: Deletes all users — use once only
// const User = require('./models/User');

// mongoose.connection.once('open', async () => {
//   try {
//     await User.deleteMany({});
//     console.log('All users deleted');
//   } catch (err) {
//     console.error('Error deleting users:', err.message);
//   }
// });
