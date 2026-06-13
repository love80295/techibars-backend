import mongoose from 'mongoose';

const solutionSchema = new mongoose.Schema({
  platform: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform',
    required: true
  },
  problemId: {
    type: String,
    required: true
  },
  problemTitle: {
    type: String,
    required: true
  },
  problemUrl: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  approach: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'Swift']
  },
  timeComplexity: {
    type: String,
    default: ''
  },
  spaceComplexity: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Text index for search functionality
solutionSchema.index({ problemTitle: 'text', approach: 'text', code: 'text' });

// Update average rating before saving
solutionSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
    this.averageRating = total / this.ratings.length;
  }
  next();
});

const Solution = mongoose.model('Solution', solutionSchema);
export default Solution;