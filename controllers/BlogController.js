import Blog from '../models/Blog.js';

export const createBlog = async (req, res) => {
  try {
    const { title, content, author, category, tags } = req.body;

    if (!title || !content || !author || !category) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const blog = await Blog.create({ title, content, author, category, tags: tags || [] });

    res.status(201).json({ success: true, message: 'Blog created', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('likes', 'name email')
      .populate('comments.user', 'name email');

    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ LIKE - Working
export const toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const userId = req.user._id;
    const likedIndex = blog.likes.indexOf(userId);

    if (likedIndex === -1) {
      blog.likes.push(userId);
    } else {
      blog.likes.splice(likedIndex, 1);
    }

    blog.likesCount = blog.likes.length;
    await blog.save();

    res.json({ success: true, data: { likesCount: blog.likesCount, isLiked: likedIndex === -1 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLikeStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const isLiked = blog.likes.includes(req.user._id);
    res.json({ success: true, data: { isLiked, likesCount: blog.likesCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ COMMENT - Working
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Comment content required' });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const newComment = {
      user: req.user._id,
      content,
      createdAt: new Date()
    };

    blog.comments.push(newComment);
    blog.commentsCount = blog.comments.length;
    await blog.save();

    await blog.populate('comments.user', 'name email');
    const addedComment = blog.comments[blog.comments.length - 1];

    res.status(201).json({ success: true, data: addedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('comments.user', 'name email');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const comments = blog.comments.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.remove();
    blog.commentsCount = blog.comments.length;
    await blog.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogsByCategory = async (req, res) => {
  try {
    const blogs = await Blog.find({ category: req.params.categoryName });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogsByTag = async (req, res) => {
  try {
    const blogs = await Blog.find({ tags: req.params.tagName });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogLikes = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('likes', 'name email');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: { likesCount: blog.likesCount, likes: blog.likes } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};