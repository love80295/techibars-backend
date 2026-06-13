import mongoose from 'mongoose';

const platformSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  logo: {
    type: String,
    default: ''
  },
  baseUrl: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#ff4d4d'
  },
  active: {
    type: Boolean,
    default: true
  },
  problemCount: {
    type: Number,
    default: 0
  },
  solutionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Platform = mongoose.model('Platform', platformSchema);
export default Platform;