import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('❌ MongoDB URI is not defined in environment variables');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host || 'localhost'}`);
console.log(`📊 Database Name: ${conn.connection.name || 'blogdb'}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;