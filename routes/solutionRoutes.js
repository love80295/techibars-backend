import express from 'express';
import {
  getSolutions,
  getSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
  rateSolution,
  upvoteSolution,
  downvoteSolution,
  addComment,
  bookmarkSolution,
  getBookmarkedSolutions,
  analyzeComplexity,
  approveSolution,
  rejectSolution,
  getPendingSolutions
} from '../controllers/solutionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getSolutions);
router.get('/:id', getSolutionById);

// Protected routes (require login)
router.get('/bookmarked', protect, getBookmarkedSolutions);
router.post('/', protect, createSolution);
router.put('/:id', protect, updateSolution);
router.delete('/:id', protect, deleteSolution);
router.post('/:id/rate', protect, rateSolution);
router.post('/:id/upvote', protect, upvoteSolution);
router.post('/:id/downvote', protect, downvoteSolution);
router.post('/:id/comment', protect, addComment);
router.post('/:id/bookmark', protect, bookmarkSolution);
router.post('/analyze/complexity', protect, analyzeComplexity);

// Admin routes
router.get('/admin/pending', protect, getPendingSolutions);
router.put('/admin/approve/:id', protect, approveSolution);
router.delete('/admin/reject/:id', protect, rejectSolution);

export default router;