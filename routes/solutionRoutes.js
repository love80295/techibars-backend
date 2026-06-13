import express from 'express';
import {
  getSolutions,
  getSolutionById,
  createSolution,
  rateSolution,
  upvoteSolution,
  downvoteSolution,
  addComment,
  bookmarkSolution,
  getBookmarkedSolutions,
  analyzeComplexity
} from '../controllers/solutionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getSolutions);
router.get('/bookmarked', protect, getBookmarkedSolutions);
router.get('/:id', getSolutionById);

// Protected routes
router.post('/', protect, createSolution);
router.post('/:id/rate', protect, rateSolution);
router.post('/:id/upvote', protect, upvoteSolution);
router.post('/:id/downvote', protect, downvoteSolution);
router.post('/:id/comment', protect, addComment);
router.post('/:id/bookmark', protect, bookmarkSolution);
router.post('/analyze/complexity', protect, analyzeComplexity);

export default router;