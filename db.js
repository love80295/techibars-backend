import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGO_URI;
    
    // Check if MongoDB URI is provided
    if (!mongoURI) {
      console.error('❌ MongoDB URI is not defined in environment variables');
      process.exit(1);
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error(`   Error: ${error.message}`);
    
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;