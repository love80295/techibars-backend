import express from 'express';
import { getPlatforms, getPlatformBySlug, createPlatform } from '../controllers/platformController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPlatforms);
router.get('/:slug', getPlatformBySlug);
router.post('/', protect, createPlatform);

export default router;