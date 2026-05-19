import express from 'express';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Test route working',
    timestamp: new Date().toISOString()
  });
});

export default router;