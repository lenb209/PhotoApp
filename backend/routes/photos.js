const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/photos - Get all photos
router.get('/', async (req, res) => {
  try {
    const photos = await db.getAllPhotos();
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// GET /api/photos/featured - Get featured photos for homepage stream
router.get('/featured', async (req, res) => {
  try {
    const featuredPhotos = await db.getFeaturedPhotos();
    res.json(featuredPhotos);
  } catch (error) {
    console.error('Error fetching featured photos:', error);
    res.status(500).json({ error: 'Failed to fetch featured photos' });
  }
});

// POST /api/photos - Upload a new photo (requires authentication)
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const { title, description, tags, featuredStream } = req.body;
    const photoId = uuidv4();
    const originalName = req.file.originalname;
    const fileExtension = path.extname(originalName);
    const filename = `${photoId}${fileExtension}`;
    const thumbnailFilename = `thumb_${photoId}${fileExtension}`;

    // Paths for original and thumbnail
    const photoPath = path.join(__dirname, '../../uploads', filename);
    const thumbnailPath = path.join(__dirname, '../../uploads', thumbnailFilename);

    // Validate image dimensions (2048px max on long edge)
    const imageMetadata = await sharp(req.file.buffer).metadata();
    const maxDimension = Math.max(imageMetadata.width, imageMetadata.height);
    
    if (maxDimension > 2048) {
      return res.status(400).json({ 
        error: `Image too large. Maximum dimension is 2048px, but your image is ${maxDimension}px. Please resize your image before uploading.` 
      });
    }

    // Validate DPI if available (should be 72 DPI or less for web)
    if (imageMetadata.density && imageMetadata.density > 72) {
      return res.status(400).json({ 
        error: `Image DPI too high. Please save your image at 72 DPI or lower for web use. Current: ${imageMetadata.density} DPI` 
      });
    }

    // Save original image without resizing (user must upload correct size)
    await sharp(req.file.buffer)
      .jpeg({ 
        quality: 90,
        progressive: true
      })
      .toFile(photoPath);

    // Create thumbnail (400px max for masonry display)
    await sharp(req.file.buffer)
      .resize(400, 400, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 75
      })
      .toFile(thumbnailPath);

    // Save photo info to database with user association
    const photoData = {
      id: photoId,
      title: title || originalName,
      description: description || '',
      tags: tags || '',
      featuredStream: featuredStream === 'true' || featuredStream === true,
      filename: filename,
      thumbnailFilename: thumbnailFilename,
      originalName: originalName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadDate: new Date().toISOString(),
      userId: req.session.userId // Associate photo with the authenticated user
    };

    const savedPhoto = await db.createPhoto(photoData);
    res.status(201).json(savedPhoto);

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// GET /api/photos/:id - Get specific photo
router.get('/:id', async (req, res) => {
  try {
    const photo = await db.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// DELETE /api/photos/:id - Delete a photo (requires authentication)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const photo = await db.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check if the user owns this photo
    if (photo.userId !== req.session.userId) {
      return res.status(403).json({ error: 'You can only delete your own photos' });
    }

    // Delete physical files
    const photoPath = path.join(__dirname, '../../uploads', photo.filename);
    const thumbnailPath = path.join(__dirname, '../../uploads', photo.thumbnailFilename);

    try {
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
    }

    // Delete from database
    await db.deletePhoto(req.params.id);
    res.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;