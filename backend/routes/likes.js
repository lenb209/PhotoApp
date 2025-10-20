const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/likes/:photoId - Toggle like on photo
router.post('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const userIP = req.ip || req.connection.remoteAddress;

    const result = await db.toggleLike(photoId, userIP);
    const likeCount = await db.getLikeCount(photoId);

    res.json({ 
      ...result, 
      likeCount 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// GET /api/likes/:photoId - Get like count and user's like status
router.get('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const userIP = req.ip || req.connection.remoteAddress;

    const likeCount = await db.getLikeCount(photoId);
    const userLiked = await db.checkUserLike(photoId, userIP);

    res.json({ 
      likeCount, 
      userLiked 
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

module.exports = router;