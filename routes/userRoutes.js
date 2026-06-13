import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  toggleBookmark,
  getBookmarks,
  getBookmarkStatus,
  getUserStats,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { getMe } from '../controllers/authController.js';

const router = express.Router();

// IMPORTANT: /me route must come BEFORE /:id route
router.get('/me', protect, getMe);

// All routes are protected (require authentication)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/stats', protect, getUserStats);
router.delete('/account', protect, deleteAccount);

// Bookmark routes
router.get('/bookmarks', protect, getBookmarks);
router.post('/bookmark/:blogId', protect, toggleBookmark);
router.get('/bookmark/status/:blogId', protect, getBookmarkStatus);

// Admin routes
router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id/role', protect, updateUserRole);
router.delete('/:id', protect, deleteUser);

export default router;