import User from '../models/User.js';
import Blog from '../models/Blog.js';

export const toggleBookmark = async (req, res) => {
  try {
    const { blogId } = req.params;
    const user = await User.findById(req.user._id);
    
    const isBookmarked = user.savedBlogs.includes(blogId);
    
    if (isBookmarked) {
      user.savedBlogs = user.savedBlogs.filter(id => id.toString() !== blogId);
    } else {
      user.savedBlogs.push(blogId);
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      data: { isBookmarked: !isBookmarked, bookmarksCount: user.savedBlogs.length } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedBlogs');
    res.json({ success: true, data: user.savedBlogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookmarkStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isBookmarked = user.savedBlogs.includes(req.params.blogId);
    res.json({ success: true, data: { isBookmarked, bookmarksCount: user.savedBlogs.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  res.json({ success: true, message: 'Password change - implement with bcrypt' });
};

export const getUserStats = async (req, res) => {
  res.json({ success: true, data: { message: 'User stats' } });
};

export const deleteAccount = async (req, res) => {
  res.json({ success: true, message: 'Account deleted' });
};

export const getAllUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  const users = await User.find().select('-password');
  res.json({ success: true, data: users });
};

export const getUserById = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  const user = await User.findById(req.params.id).select('-password');
  res.json({ success: true, data: user });
};

export const updateUserRole = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  res.json({ success: true, data: user });
};

export const deleteUser = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted' });
};