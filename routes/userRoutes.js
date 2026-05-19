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

const router = express.Router();

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
router.get('/:id', protect, getUserById); // Fixed: added colon
router.put('/:id/role', protect, updateUserRole); // Fixed: added colon
router.delete('/:id', protect, deleteUser); // Fixed: added colon

export default router;