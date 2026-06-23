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

// 🆕 Import AI Controller
import { 
  detectTopics, 
  explainSolution,
  getAIStatus
} from '../controllers/aiController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================
router.get('/', getSolutions);
router.get('/:id', getSolutionById);

// ============================================================
// AI ROUTES (Protected)
// ============================================================
router.post('/detect-topics', protect, detectTopics);
router.get('/:id/explain', protect, explainSolution);
router.get('/ai/status', protect, getAIStatus);

// ============================================================
// PROTECTED ROUTES (Require Login)
// ============================================================
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

// ============================================================
// ADMIN ROUTES
// ============================================================
router.get('/admin/pending', protect, getPendingSolutions);
router.put('/admin/approve/:id', protect, approveSolution);
router.delete('/admin/reject/:id', protect, rejectSolution);

export default router;