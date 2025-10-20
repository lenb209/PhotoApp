const express = require('express');
const db = require('../database/db');

const router = express.Router();

// GET /api/users/count - Get total user count
router.get('/count', async (req, res) => {
  try {
    // For now, return a simulated count since we don't have actual user registration yet
    const photoCount = await db.getPhotosCount();
    
    // Simulate user count based on photos (every 3-4 photos represents 1 user)
    const simulatedUserCount = Math.floor(photoCount * 0.3) + 150;
    
    res.json({ count: simulatedUserCount });
  } catch (error) {
    console.error('Error getting user count:', error);
    res.status(500).json({ error: 'Failed to get user count' });
  }
});

// GET /api/users - Get all users (for future use)
router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create new user (for future use)
router.post('/', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const userData = {
      id: require('uuid').v4(),
      username,
      email
    };

    const newUser = await db.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;