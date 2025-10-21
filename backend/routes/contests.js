const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Configure multer for contest entry uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const contestDir = path.join(__dirname, '../../uploads/contests');
        if (!fs.existsSync(contestDir)) {
            fs.mkdirSync(contestDir, { recursive: true });
        }
        cb(null, contestDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'contest-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get all public contests
router.get('/', async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = `
            SELECT c.*, 
                   COUNT(ce.id) as total_entries,
                   cl.name as club_name
            FROM contests c 
            LEFT JOIN contest_entries ce ON c.id = ce.contest_id 
            LEFT JOIN clubs cl ON c.club_id = cl.id
            WHERE c.is_public = 1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }
        
        if (category) {
            query += ' AND c.category = ?';
            params.push(category);
        }
        
        query += ' GROUP BY c.id ORDER BY c.created_at DESC';
        
        const contests = await db.all(query, params);
        
        // Format dates and add computed fields
        const formattedContests = contests.map(contest => ({
            ...contest,
            start_date: contest.start_date,
            end_date: contest.end_date,
            prizes: JSON.parse(contest.prizes || '[]'),
            total_entries: contest.total_entries || 0,
            days_left: contest.status === 'active' ? 
                Math.ceil((new Date(contest.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
        }));
        
        res.json(formattedContests);
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// Get contest by ID
router.get('/:id', async (req, res) => {
    try {
        const contestId = req.params.id;
        
        const contest = await db.get(`
            SELECT c.*, 
                   COUNT(ce.id) as total_entries,
                   cl.name as club_name
            FROM contests c 
            LEFT JOIN contest_entries ce ON c.id = ce.contest_id 
            LEFT JOIN clubs cl ON c.club_id = cl.id
            WHERE c.id = ? AND (c.is_public = 1 OR c.club_id IS NULL)
            GROUP BY c.id
        `, [contestId]);
        
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }
        
        // Get contest entries (public info only)
        const entries = await db.all(`
            SELECT ce.id, ce.title, ce.created_at, u.username, u.display_name
            FROM contest_entries ce
            JOIN users u ON ce.user_id = u.id
            WHERE ce.contest_id = ?
            ORDER BY ce.created_at DESC
        `, [contestId]);
        
        const formattedContest = {
            ...contest,
            prizes: JSON.parse(contest.prizes || '[]'),
            total_entries: contest.total_entries || 0,
            entries: entries
        };
        
        res.json(formattedContest);
    } catch (error) {
        console.error('Error fetching contest:', error);
        res.status(500).json({ error: 'Failed to fetch contest details' });
    }
});

// Get user's contest entries
router.get('/my/entries', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const entries = await db.all(`
            SELECT ce.*, c.title as contest_title, c.status as contest_status,
                   c.end_date, c.club_id, cl.name as club_name
            FROM contest_entries ce
            JOIN contests c ON ce.contest_id = c.id
            LEFT JOIN clubs cl ON c.club_id = cl.id
            WHERE ce.user_id = ?
            ORDER BY ce.created_at DESC
        `, [userId]);
        
        const formattedEntries = entries.map(entry => ({
            ...entry,
            contest: {
                id: entry.contest_id,
                title: entry.contest_title,
                status: entry.contest_status,
                end_date: entry.end_date,
                club_name: entry.club_name
            }
        }));
        
        res.json(formattedEntries);
    } catch (error) {
        console.error('Error fetching user entries:', error);
        res.status(500).json({ error: 'Failed to fetch your contest entries' });
    }
});

// Submit contest entry
router.post('/:id/enter', requireAuth, upload.single('photo'), async (req, res) => {
    try {
        const contestId = req.params.id;
        const userId = req.user.id;
        const { title, description } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Photo is required' });
        }
        
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        // Check if contest exists and is active
        const contest = await db.get(`
            SELECT * FROM contests 
            WHERE id = ? AND status = 'active' AND end_date > datetime('now')
        `, [contestId]);
        
        if (!contest) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Contest not found or not accepting entries' });
        }
        
        // Check if user has already reached max entries
        const existingEntries = await db.get(`
            SELECT COUNT(*) as count FROM contest_entries 
            WHERE contest_id = ? AND user_id = ?
        `, [contestId, userId]);
        
        if (existingEntries.count >= contest.max_entries) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                error: `Maximum ${contest.max_entries} entries allowed per user` 
            });
        }
        
        // Check if user is club member for club contests
        if (contest.club_id && !contest.is_public) {
            const membership = await db.get(`
                SELECT * FROM club_members 
                WHERE club_id = ? AND user_id = ? AND status = 'approved'
            `, [contest.club_id, userId]);
            
            if (!membership) {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ error: 'You must be a club member to enter this contest' });
            }
        }
        
        // Create contest entry
        const filename = req.file.filename;
        const filePath = `/uploads/contests/${filename}`;
        
        const result = await db.run(`
            INSERT INTO contest_entries (contest_id, user_id, title, description, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [contestId, userId, title.trim(), description?.trim() || '', filePath]);
        
        // Get the created entry
        const entry = await db.get(`
            SELECT ce.*, u.username, u.display_name
            FROM contest_entries ce
            JOIN users u ON ce.user_id = u.id
            WHERE ce.id = ?
        `, [result.lastID]);
        
        res.status(201).json({
            message: 'Contest entry submitted successfully',
            entry: entry
        });
        
    } catch (error) {
        console.error('Error submitting contest entry:', error);
        
        // Clean up uploaded file if error occurred
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'Failed to submit contest entry' });
    }
});

// Get club contests (for club pages)
router.get('/club/:clubId', optionalAuth, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        const userId = req.user ? req.user.id : null;
        
        // Check if user is club member
        let isMember = false;
        if (userId) {
            const membership = await db.get(`
                SELECT * FROM club_members 
                WHERE club_id = ? AND user_id = ? AND status = 'approved'
            `, [clubId, userId]);
            isMember = !!membership;
        }
        
        // Build query based on membership
        let query = `
            SELECT c.*, 
                   COUNT(ce.id) as total_entries,
                   cl.name as club_name
            FROM contests c 
            LEFT JOIN contest_entries ce ON c.id = ce.contest_id 
            LEFT JOIN clubs cl ON c.club_id = cl.id
            WHERE c.club_id = ?
        `;
        
        if (!isMember) {
            query += ' AND c.is_public = 1';
        }
        
        query += ' GROUP BY c.id ORDER BY c.created_at DESC';
        
        const contests = await db.all(query, [clubId]);
        
        const formattedContests = contests.map(contest => ({
            ...contest,
            prizes: JSON.parse(contest.prizes || '[]'),
            total_entries: contest.total_entries || 0,
            can_enter: isMember || contest.is_public
        }));
        
        res.json(formattedContests);
    } catch (error) {
        console.error('Error fetching club contests:', error);
        res.status(500).json({ error: 'Failed to fetch club contests' });
    }
});

// Create contest (club admins only)
router.post('/create', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            category,
            start_date,
            end_date,
            entry_fee,
            max_entries,
            prizes,
            club_id,
            is_public
        } = req.body;
        
        // Validate required fields
        if (!title || !description || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // If club contest, verify user is admin
        if (club_id) {
            const membership = await db.get(`
                SELECT * FROM club_members 
                WHERE club_id = ? AND user_id = ? AND role IN ('admin', 'owner')
            `, [club_id, userId]);
            
            if (!membership) {
                return res.status(403).json({ error: 'Only club admins can create club contests' });
            }
        }
        
        // Determine status based on dates
        const now = new Date();
        const contestStart = new Date(start_date);
        const contestEnd = new Date(end_date);
        
        let status = 'upcoming';
        if (now >= contestStart && now <= contestEnd) {
            status = 'active';
        } else if (now > contestEnd) {
            status = 'ended';
        }
        
        const result = await db.run(`
            INSERT INTO contests (
                title, description, category, start_date, end_date, 
                entry_fee, max_entries, prizes, club_id, is_public, 
                status, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            title, description, category || 'General', start_date, end_date,
            entry_fee || 0, max_entries || 3, JSON.stringify(prizes || []),
            club_id || null, is_public !== false, status, userId
        ]);
        
        const contest = await db.get('SELECT * FROM contests WHERE id = ?', [result.lastID]);
        
        res.status(201).json({
            message: 'Contest created successfully',
            contest: {
                ...contest,
                prizes: JSON.parse(contest.prizes || '[]')
            }
        });
        
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).json({ error: 'Failed to create contest' });
    }
});

module.exports = router;