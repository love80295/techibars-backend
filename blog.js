import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    minlength: [10, 'Content must be at least 10 characters long']
  },
  
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    default: function() {
      // Generate excerpt from content if not provided
      return this.content ? this.content.substring(0, 150) + '...' : '';
    }
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: [true, 'Author is required']
  },
  
  categories: [{
    type: String,
    trim: true
  }],
  
  tags: [{
    type: String,
    trim: true
  }],
  
  featuredImage: {
    url: {
      type: String,
      default: null
    },
    alt: {
      type: String,
      default: ''
    },
    caption: String
  },
  
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft',
    index: true
  },
  
  publishedAt: {
    type: Date,
    default: null
  },
  
  readingTime: {
    type: Number,
    min: 0,
    default: 0
  },
  
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  meta: {
    title: {
      type: String,
      maxlength: [60, 'Meta title should not exceed 60 characters']
    },
    description: {
      type: String,
      maxlength: [160, 'Meta description should not exceed 160 characters']
    },
    keywords: [String]
  },
  
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
blogSchema.index({ title: 'text', content: 'text', tags: 'text' }); // Text search index
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ categories: 1 });
blogSchema.index({ tags: 1 });

// Pre-save middleware to generate slug and calculate reading time
blogSchema.pre('save', async function(next) {
  // Generate slug from title if not provided
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check for duplicate slugs and add number if needed
    const existingBlog = await this.constructor.findOne({ slug: this.slug });
    if (existingBlog && existingBlog._id.toString() !== this._id.toString()) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Calculate reading time
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  next();
});

// Pre-update middleware
blogSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Update publishedAt if status changes to published
  if (update.status === 'published' && !update.publishedAt) {
    update.publishedAt = new Date();
  }
  
  next();
});

// Virtual for URL
blogSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  return this.publishedAt ? this.publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;
});

// Instance methods
blogSchema.methods = {
  // Increment view count
  async incrementViews() {
    this.views += 1;
    return this.save();
  },
  
  // Toggle like
  async toggleLike(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
      this.likes.push(userId);
      this.likesCount += 1;
    } else {
      this.likes.splice(index, 1);
      this.likesCount -= 1;
    }
    return this.save();
  },
  
  // Add comment
  async addComment(userId, content) {
    const comment = {
      user: userId,
      content,
      createdAt: new Date()
    };
    
    this.comments.push(comment);
    this.commentsCount += 1;
    return this.save();
  },
  
  // Update comment
  async updateComment(commentId, userId, content) {
    const comment = this.comments.id(commentId);
    if (comment && comment.user.toString() === userId.toString()) {
      comment.content = content;
      comment.updatedAt = new Date();
      comment.isEdited = true;
      return this.save();
    }
    throw new Error('Comment not found or unauthorized');
  },
  
  // Delete comment
  async deleteComment(commentId, userId) {
    const comment = this.comments.id(commentId);
    if (comment && comment.user.toString() === userId.toString()) {
      comment.remove();
      this.commentsCount -= 1;
      return this.save();
    }
    throw new Error('Comment not found or unauthorized');
  }
};

// Static methods
blogSchema.statics = {
  // Find published blogs
  findPublished() {
    return this.find({ 
      status: 'published', 
      isDeleted: false,
      publishedAt: { $lte: new Date() }
    }).sort({ publishedAt: -1 });
  },
  
  // Find blogs by author
  findByAuthor(authorId) {
    return this.find({ 
      author: authorId, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
  },
  
  // Search blogs
  async search(query, options = {}) {
    const { page = 1, limit = 10, status = 'published' } = options;
    
    const searchQuery = {
      $text: { $search: query },
      status,
      isDeleted: false
    };
    
    const blogs = await this.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name email avatar');
    
    const total = await this.countDocuments(searchQuery);
    
    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },
  
  // Get popular blogs
  async getPopular(limit = 5) {
    return this.find({ 
      status: 'published', 
      isDeleted: false 
    })
    .sort({ views: -1, likesCount: -1 })
    .limit(limit)
    .populate('author', 'name email');
  },
  
  // Get related blogs
  async getRelated(blogId, tags, categories, limit = 3) {
    return this.find({
      _id: { $ne: blogId },
      status: 'published',
      isDeleted: false,
      $or: [
        { tags: { $in: tags } },
        { categories: { $in: categories } }
      ]
    })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('author', 'name email');
  }
};

// Create the model
const Blog = mongoose.model('Blog', blogSchema);

export default Blog;