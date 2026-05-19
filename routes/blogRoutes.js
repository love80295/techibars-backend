import express from 'express';
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsByCategory,
  getBlogsByTag,
  toggleLike,
  getLikeStatus,
  getBlogLikes,
  addComment,
  getComments,
  deleteComment,
  // incrementViews, // Uncomment when implemented
  // getTrendingBlogs, // Uncomment when implemented
  // getPopularBlogs // Uncomment when implemented
} from '../controllers/BlogController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllBlogs);
// router.get('/trending', getTrendingBlogs); // Uncomment when implemented
// router.get('/popular', getPopularBlogs); // Uncomment when implemented
router.get('/category/:categoryName', getBlogsByCategory);
router.get('/tag/:tagName', getBlogsByTag);
router.get('/:id', getBlogById); // Fixed: added colon
router.get('/:id/likes', getBlogLikes); // Fixed: added colon
router.get('/:id/comments', getComments); // Fixed: added colon

// View count route (public)
// router.post('/:id/view', incrementViews); // Uncomment when implemented

// Protected routes (require authentication)
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

// Like routes
router.post('/:id/like', protect, toggleLike);
router.get('/:id/like/status', protect, getLikeStatus);

// Comment routes
router.post('/:id/comments', protect, addComment);
router.delete('/:blogId/comments/:commentId', protect, deleteComment);

export default router;