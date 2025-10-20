const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/comments/:photoId - Add comment to photo
router.post('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { username, comment } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Comment too long (max 500 characters)' });
    }

    const newComment = await db.addComment(
      photoId, 
      username || 'Anonymous', 
      comment.trim(), 
      userIP
    );

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/comments/:photoId - Get comments for photo
router.get('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const comments = await db.getCommentsByPhoto(photoId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// GET /api/comments/:photoId/count - Get comment count for photo
router.get('/:photoId/count', async (req, res) => {
  try {
    const { photoId } = req.params;
    const count = await db.getCommentCount(photoId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    res.status(500).json({ error: 'Failed to fetch comment count' });
  }
});

module.exports = router;