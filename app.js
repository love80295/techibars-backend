// import express from 'express';
// import cors from 'cors';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import blogRoutes from './routes/blogRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';

// dotenv.config();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Database connection - UNCOMMENTED
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB connection error:', err));

// app.use((req, res, next) => {
//   console.log("➡️ REQUEST AA RAHI HAI!", req.method, req.url);
//   next();
// });

// // Routes
// app.use('/api/blogs', blogRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// // Home route - Fixed JSON structure
// app.get('/', (req, res) => {
//   res.json({
//     message: '📝 Blog API is running',
//     endpoints: {
//       auth: {
//         signup: 'POST /api/auth/signup',
//         login: 'POST /api/auth/login',
//         profile: 'GET /api/auth/me'
//       },
//       blogs: {
//         getAll: 'GET /api/blogs',
//         create: 'POST /api/blogs',
//         getOne: 'GET /api/blogs/:id',
//         update: 'PUT /api/blogs/:id',
//         delete: 'DELETE /api/blogs/:id',
//         like: 'POST /api/blogs/:id/like',
//         comments: 'GET /api/blogs/:id/comments',
//         addComment: 'POST /api/blogs/:id/comments'
//       },
//       users: {
//         bookmarks: 'GET /api/users/bookmarks',
//         toggleBookmark: 'POST /api/users/bookmark/:blogId',
//         bookmarkStatus: 'GET /api/users/bookmark/status/:blogId'
//       }
//     }
//   });
// });

// export default app;

// import express from 'express';
// import cors from 'cors';

// const app = express();

// app.use(cors());
// app.use(express.json());

// // TEST ROUTE (IMPORTANT)
// app.get('/', (req, res) => {
//     console.log("ROOT HIT");
//   res.send("🔥 API WORKING");
// });

// export default app;

import express from 'express';
import cors from 'cors';

import blogRoutes from './routes/blogRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug (optional but useful)
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

// Test route (important - rehne de)
app.get('/', (req, res) => {
  res.send("🔥 API WORKING");
});

// Routes
app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

export default app;