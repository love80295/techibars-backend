// import app from "./app.js";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";

// dotenv.config();

// const startServer = async () => {
//   try {
//     console.log("🔄 Connecting to MongoDB...");
//     await connectDB();

//     const PORT = process.env.PORT || 5000;

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server is running on port ${PORT}`);
//     });

//   } catch (error) {
//     console.error("❌ Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// startServer();

// import app from './app.js';

// const PORT = 5001;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

// // 👇 ye add kar
// setInterval(() => {
//   console.log("Server alive...");
// }, 5001);

import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const startServer = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await connectDB();

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server failed:", error.message);
    process.exit(1);
  }
};

startServer();