import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  savedBlogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  solvedProblems: [{
    platform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
    problemId: { type: String },
    problemTitle: { type: String },
    solvedAt: { type: Date, default: Date.now }
  }],
  bookmarkedSolutions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution'
  }]
}, {
  timestamps: true
});

// NO pre-save hook here! Password hashing is done in controller
// NO next() function to cause errors!

const User = mongoose.model('User', userSchema);
export default User;