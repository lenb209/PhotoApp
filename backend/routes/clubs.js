const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const {
  createClub,
  getClubById,
  getAllClubs,
  getClubsByUserId,
  joinClub,
  leaveClub,
  isClubMember,
  getClubMembers,
  addPhotoToClub,
  getClubPhotos,
  updateClub,
  deleteClub
} = require('../database/db');

const router = express.Router();

// GET /api/clubs - Get all public clubs
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const clubs = await getAllClubs(parseInt(limit), parseInt(offset));
    res.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// POST /api/clubs - Create a new club (requires authentication)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Club name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Club name must be 100 characters or less' });
    }

    const clubData = {
      id: uuidv4(),
      name: name.trim(),
      description: description ? description.trim() : '',
      creatorId: req.session.userId,
      coverImage: null,
      isPrivate: isPrivate === true || isPrivate === 'true'
    };

    const newClub = await createClub(clubData);
    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      club: newClub
    });

  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

// GET /api/clubs/:id - Get specific club
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const club = await getClubById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if club is private and user has access
    if (club.isPrivate && req.session.userId) {
      const membership = await isClubMember(club.id, req.session.userId);
      if (!membership.isMember) {
        return res.status(403).json({ error: 'This club is private' });
      }
    } else if (club.isPrivate && !req.session.userId) {
      return res.status(403).json({ error: 'This club is private' });
    }

    // Add membership info if user is authenticated
    if (req.session.userId) {
      const membership = await isClubMember(club.id, req.session.userId);
      club.userMembership = membership;
    }

    res.json(club);
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
});

// POST /api/clubs/:id/join - Join a club (requires authentication)
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.userId;

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if already a member
    const membership = await isClubMember(clubId, userId);
    if (membership.isMember) {
      return res.status(400).json({ error: 'You are already a member of this club' });
    }

    // Join the club
    await joinClub(clubId, userId);
    res.json({
      success: true,
      message: 'Successfully joined the club'
    });

  } catch (error) {
    console.error('Error joining club:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'You are already a member of this club' });
    } else {
      res.status(500).json({ error: 'Failed to join club' });
    }
  }
});

// POST /api/clubs/:id/leave - Leave a club (requires authentication)
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.userId;

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member
    const membership = await isClubMember(clubId, userId);
    if (!membership.isMember) {
      return res.status(400).json({ error: 'You are not a member of this club' });
    }

    // Check if user is the owner
    if (membership.role === 'owner') {
      return res.status(400).json({ error: 'Club owners cannot leave their club. Transfer ownership or delete the club instead.' });
    }

    // Leave the club
    await leaveClub(clubId, userId);
    res.json({
      success: true,
      message: 'Successfully left the club'
    });

  } catch (error) {
    console.error('Error leaving club:', error);
    res.status(500).json({ error: 'Failed to leave club' });
  }
});

// GET /api/clubs/:id/members - Get club members
router.get('/:id/members', optionalAuth, async (req, res) => {
  try {
    const clubId = req.params.id;

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if club is private and user has access
    if (club.isPrivate && req.session.userId) {
      const membership = await isClubMember(clubId, req.session.userId);
      if (!membership.isMember) {
        return res.status(403).json({ error: 'This club is private' });
      }
    } else if (club.isPrivate && !req.session.userId) {
      return res.status(403).json({ error: 'This club is private' });
    }

    const members = await getClubMembers(clubId);
    res.json(members);
  } catch (error) {
    console.error('Error fetching club members:', error);
    res.status(500).json({ error: 'Failed to fetch club members' });
  }
});

// GET /api/clubs/:id/photos - Get club photos
router.get('/:id/photos', optionalAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const { limit = 20, offset = 0 } = req.query;

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if club is private and user has access
    if (club.isPrivate && req.session.userId) {
      const membership = await isClubMember(clubId, req.session.userId);
      if (!membership.isMember) {
        return res.status(403).json({ error: 'This club is private' });
      }
    } else if (club.isPrivate && !req.session.userId) {
      return res.status(403).json({ error: 'This club is private' });
    }

    const photos = await getClubPhotos(clubId, parseInt(limit), parseInt(offset));
    res.json(photos);
  } catch (error) {
    console.error('Error fetching club photos:', error);
    res.status(500).json({ error: 'Failed to fetch club photos' });
  }
});

// POST /api/clubs/:id/photos - Add photo to club (requires authentication and membership)
router.post('/:id/photos', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const { photoId } = req.body;
    const userId = req.session.userId;

    if (!photoId) {
      return res.status(400).json({ error: 'Photo ID is required' });
    }

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member
    const membership = await isClubMember(clubId, userId);
    if (!membership.isMember) {
      return res.status(403).json({ error: 'You must be a member to post photos to this club' });
    }

    // Add photo to club
    await addPhotoToClub(clubId, photoId, userId);
    res.json({
      success: true,
      message: 'Photo added to club successfully'
    });

  } catch (error) {
    console.error('Error adding photo to club:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'This photo is already posted to this club' });
    } else {
      res.status(500).json({ error: 'Failed to add photo to club' });
    }
  }
});

// GET /api/clubs/user/:userId - Get clubs for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const clubs = await getClubsByUserId(req.params.userId);
    res.json(clubs);
  } catch (error) {
    console.error('Error fetching user clubs:', error);
    res.status(500).json({ error: 'Failed to fetch user clubs' });
  }
});

// PUT /api/clubs/:id - Update club (requires owner or admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const { name, description, isPrivate } = req.body;
    const userId = req.session.userId;

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user has permission to update
    const membership = await isClubMember(clubId, userId);
    if (!membership.isMember || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({ error: 'Only club owners and admins can update club information' });
    }

    // Validate input
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Club name cannot be empty' });
    }

    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Club name must be 100 characters or less' });
    }

    const updateData = {
      name: name ? name.trim() : club.name,
      description: description !== undefined ? description.trim() : club.description,
      coverImage: club.coverImage, // TODO: Handle cover image uploads
      isPrivate: isPrivate !== undefined ? (isPrivate === true || isPrivate === 'true') : club.isPrivate
    };

    const updatedClub = await updateClub(clubId, updateData);
    res.json({
      success: true,
      message: 'Club updated successfully',
      club: updatedClub
    });

  } catch (error) {
    console.error('Error updating club:', error);
    res.status(500).json({ error: 'Failed to update club' });
  }
});

// DELETE /api/clubs/:id - Delete club (requires owner)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.userId;

    // Check if club exists
    const club = await getClubById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is the owner
    const membership = await isClubMember(clubId, userId);
    if (!membership.isMember || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only the club owner can delete the club' });
    }

    // Delete the club
    await deleteClub(clubId);
    res.json({
      success: true,
      message: 'Club deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting club:', error);
    res.status(500).json({ error: 'Failed to delete club' });
  }
});

module.exports = router;