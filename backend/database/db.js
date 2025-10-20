const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'photos.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('📄 Connected to SQLite database');
    initializeTables();
  }
});

// Create tables if they don't exist
function initializeTables() {
  // Photos table
  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      featuredStream BOOLEAN DEFAULT 1,
      filename TEXT NOT NULL,
      thumbnailFilename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      mimeType TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating photos table:', err);
    } else {
      console.log('✅ Photos table ready');
      
      // Add new columns if they don't exist (migration)
      db.run(`ALTER TABLE photos ADD COLUMN tags TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding tags column:', err);
        }
      });
      
      db.run(`ALTER TABLE photos ADD COLUMN featuredStream BOOLEAN DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding featuredStream column:', err);
        }
      });
    }
  });

  // Users table (for future enhancement)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('✅ Users table ready');
    }
  });

  // Likes table
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      photoId TEXT NOT NULL,
      userId TEXT DEFAULT 'anonymous',
      userIP TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (photoId) REFERENCES photos (id) ON DELETE CASCADE,
      UNIQUE(photoId, userId, userIP)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating likes table:', err);
    } else {
      console.log('✅ Likes table ready');
    }
  });

  // Comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      photoId TEXT NOT NULL,
      username TEXT DEFAULT 'Anonymous',
      comment TEXT NOT NULL,
      userIP TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (photoId) REFERENCES photos (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating comments table:', err);
    } else {
      console.log('✅ Comments table ready');
    }
  });
}

// Photo operations
const photoOperations = {
  // Get all photos
  getAllPhotos: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM photos 
        ORDER BY createdAt DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get featured photos for homepage stream
  getFeaturedPhotos: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM photos 
        WHERE featuredStream = 1
        ORDER BY createdAt DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get photo by ID
  getPhotoById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM photos 
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create new photo
  createPhoto: (photoData) => {
    return new Promise((resolve, reject) => {
      const {
        id, title, description, tags, featuredStream, filename, thumbnailFilename,
        originalName, fileSize, mimeType, uploadDate
      } = photoData;

      db.run(`
        INSERT INTO photos (
          id, title, description, tags, featuredStream, filename, thumbnailFilename,
          originalName, fileSize, mimeType, uploadDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, title, description, tags, featuredStream, filename, thumbnailFilename,
        originalName, fileSize, mimeType, uploadDate
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          // Return the created photo
          photoOperations.getPhotoById(id)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },

  // Update photo
  updatePhoto: (id, updates) => {
    return new Promise((resolve, reject) => {
      const { title, description } = updates;
      db.run(`
        UPDATE photos 
        SET title = ?, description = ?
        WHERE id = ?
      `, [title, description, id], function(err) {
        if (err) {
          reject(err);
        } else {
          photoOperations.getPhotoById(id)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },

  // Delete photo
  deletePhoto: (id) => {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM photos 
        WHERE id = ?
      `, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Get photos count
  getPhotosCount: () => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count 
        FROM photos
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }
};

// User operations (for future enhancement)
const userOperations = {
  // Get all users
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, username, email, createdAt 
        FROM users 
        ORDER BY createdAt DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get user by ID
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id, username, email, createdAt 
        FROM users 
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create user
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { id, username, email } = userData;
      db.run(`
        INSERT INTO users (id, username, email) 
        VALUES (?, ?, ?)
      `, [id, username, email], function(err) {
        if (err) {
          reject(err);
        } else {
          userOperations.getUserById(id)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }
};

// Like operations
const likeOperations = {
  // Toggle like (add or remove)
  toggleLike: (photoId, userIP) => {
    return new Promise((resolve, reject) => {
      const { v4: uuidv4 } = require('uuid');
      
      // First check if like exists
      db.get(`
        SELECT id FROM likes 
        WHERE photoId = ? AND userIP = ?
      `, [photoId, userIP], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          // Like exists, remove it
          db.run(`
            DELETE FROM likes 
            WHERE photoId = ? AND userIP = ?
          `, [photoId, userIP], (err) => {
            if (err) reject(err);
            else resolve({ liked: false });
          });
        } else {
          // Like doesn't exist, add it
          const likeId = uuidv4();
          db.run(`
            INSERT INTO likes (id, photoId, userIP)
            VALUES (?, ?, ?)
          `, [likeId, photoId, userIP], (err) => {
            if (err) reject(err);
            else resolve({ liked: true });
          });
        }
      });
    });
  },

  // Get like count for photo
  getLikeCount: (photoId) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM likes 
        WHERE photoId = ?
      `, [photoId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  },

  // Check if user liked photo
  checkUserLike: (photoId, userIP) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM likes 
        WHERE photoId = ? AND userIP = ?
      `, [photoId, userIP], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }
};

// Comment operations
const commentOperations = {
  // Add comment
  addComment: (photoId, username, comment, userIP) => {
    return new Promise((resolve, reject) => {
      const { v4: uuidv4 } = require('uuid');
      const commentId = uuidv4();
      
      db.run(`
        INSERT INTO comments (id, photoId, username, comment, userIP)
        VALUES (?, ?, ?, ?, ?)
      `, [commentId, photoId, username, comment, userIP], function(err) {
        if (err) {
          reject(err);
        } else {
          commentOperations.getCommentById(commentId)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },

  // Get comments for photo
  getCommentsByPhoto: (photoId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM comments 
        WHERE photoId = ?
        ORDER BY createdAt ASC
      `, [photoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get comment by ID
  getCommentById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM comments 
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get comment count for photo
  getCommentCount: (photoId) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM comments 
        WHERE photoId = ?
      `, [photoId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }
};

// Export database operations
module.exports = {
  db,
  ...photoOperations,
  ...userOperations,
  ...likeOperations,
  ...commentOperations
};