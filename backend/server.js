const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, '../data')
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/static', express.static(path.join(__dirname, '../frontend')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/users', require('./routes/users'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/contests', require('./routes/contests'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/user-dashboard.html'));
});

app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/user-dashboard.html'));
});

app.get('/club', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/club.html'));
});

app.get('/contests', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/contests.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Photo sharing API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Photo sharing server running on http://localhost:${PORT}`);
  console.log(`📸 Upload photos at http://localhost:${PORT}/api/photos`);
});