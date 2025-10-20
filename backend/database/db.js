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
      
      db.run(`ALTER TABLE photos ADD COLUMN userId TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding userId column:', err);
        }
      });
    }
  });

  // Users table with authentication
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT,
      bio TEXT,
      profileImage TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('✅ Users table ready');
      
      // Add new authentication columns if they don't exist (migration)
      db.run(`ALTER TABLE users ADD COLUMN password TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding password column:', err);
        }
      });
      
      db.run(`ALTER TABLE users ADD COLUMN displayName TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding displayName column:', err);
        }
      });
      
      db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding bio column:', err);
        }
      });
      
      db.run(`ALTER TABLE users ADD COLUMN profileImage TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding profileImage column:', err);
        }
      });
    }
  });

  // Sessions table for authentication
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire DATETIME NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating sessions table:', err);
    } else {
      console.log('✅ Sessions table ready');
    }
  });

  // Clubs table
  db.run(`
    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creatorId TEXT NOT NULL,
      coverImage TEXT,
      isPrivate BOOLEAN DEFAULT 0,
      memberCount INTEGER DEFAULT 1,
      photoCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creatorId) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating clubs table:', err);
    } else {
      console.log('✅ Clubs table ready');
    }
  });

  // Club members table
  db.run(`
    CREATE TABLE IF NOT EXISTS club_members (
      id TEXT PRIMARY KEY,
      clubId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clubId) REFERENCES clubs (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(clubId, userId)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating club_members table:', err);
    } else {
      console.log('✅ Club members table ready');
    }
  });

  // Club photos table (junction table for photos posted to clubs)
  db.run(`
    CREATE TABLE IF NOT EXISTS club_photos (
      id TEXT PRIMARY KEY,
      clubId TEXT NOT NULL,
      photoId TEXT NOT NULL,
      postedBy TEXT NOT NULL,
      postedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clubId) REFERENCES clubs (id) ON DELETE CASCADE,
      FOREIGN KEY (photoId) REFERENCES photos (id) ON DELETE CASCADE,
      FOREIGN KEY (postedBy) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(clubId, photoId)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating club_photos table:', err);
    } else {
      console.log('✅ Club photos table ready');
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
        SELECT id, username, email, displayName, bio, profileImage, createdAt 
        FROM users 
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create user with authentication
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { id, username, email, password, displayName } = userData;
      db.run(`
        INSERT INTO users (id, username, email, password, displayName) 
        VALUES (?, ?, ?, ?, ?)
      `, [id, username, email, password, displayName], function(err) {
        if (err) {
          reject(err);
        } else {
          userOperations.getUserById(id)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },

  // Get user by username (for login)
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM users 
        WHERE username = ?
      `, [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM users 
        WHERE email = ?
      `, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Update user profile
  updateUserProfile: (id, displayName, bio, profileImage) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE users 
        SET displayName = ?, bio = ?, profileImage = ?
        WHERE id = ?
      `, [displayName, bio, profileImage, id], function(err) {
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

// Club operations
const clubOperations = {
  // Create new club
  createClub: (clubData) => {
    return new Promise((resolve, reject) => {
      const { id, name, description, creatorId, coverImage, isPrivate } = clubData;
      db.run(`
        INSERT INTO clubs (id, name, description, creatorId, coverImage, isPrivate)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, name, description, creatorId, coverImage, isPrivate], function(err) {
        if (err) {
          reject(err);
        } else {
          // Add creator as owner of the club
          const { v4: uuidv4 } = require('uuid');
          const membershipId = uuidv4();
          db.run(`
            INSERT INTO club_members (id, clubId, userId, role)
            VALUES (?, ?, ?, 'owner')
          `, [membershipId, id, creatorId], (memberErr) => {
            if (memberErr) {
              reject(memberErr);
            } else {
              clubOperations.getClubById(id)
                .then(resolve)
                .catch(reject);
            }
          });
        }
      });
    });
  },

  // Get club by ID
  getClubById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT c.*, u.username as creatorUsername, u.displayName as creatorDisplayName
        FROM clubs c
        LEFT JOIN users u ON c.creatorId = u.id
        WHERE c.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get all clubs with pagination
  getAllClubs: (limit = 20, offset = 0) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, u.username as creatorUsername, u.displayName as creatorDisplayName
        FROM clubs c
        LEFT JOIN users u ON c.creatorId = u.id
        WHERE c.isPrivate = 0
        ORDER BY c.createdAt DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get clubs by user ID (clubs the user is a member of)
  getClubsByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, u.username as creatorUsername, u.displayName as creatorDisplayName, cm.role
        FROM clubs c
        LEFT JOIN users u ON c.creatorId = u.id
        JOIN club_members cm ON c.id = cm.clubId
        WHERE cm.userId = ?
        ORDER BY c.createdAt DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Join club
  joinClub: (clubId, userId) => {
    return new Promise((resolve, reject) => {
      const { v4: uuidv4 } = require('uuid');
      const membershipId = uuidv4();
      
      db.run(`
        INSERT INTO club_members (id, clubId, userId, role)
        VALUES (?, ?, ?, 'member')
      `, [membershipId, clubId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          // Update member count
          db.run(`
            UPDATE clubs SET memberCount = memberCount + 1 WHERE id = ?
          `, [clubId], (updateErr) => {
            if (updateErr) reject(updateErr);
            else resolve({ success: true, membershipId });
          });
        }
      });
    });
  },

  // Leave club
  leaveClub: (clubId, userId) => {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM club_members 
        WHERE clubId = ? AND userId = ?
      `, [clubId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          // Update member count
          db.run(`
            UPDATE clubs SET memberCount = memberCount - 1 WHERE id = ?
          `, [clubId], (updateErr) => {
            if (updateErr) reject(updateErr);
            else resolve({ success: true });
          });
        }
      });
    });
  },

  // Check if user is member of club
  isClubMember: (clubId, userId) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT role FROM club_members 
        WHERE clubId = ? AND userId = ?
      `, [clubId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? { isMember: true, role: row.role } : { isMember: false, role: null });
      });
    });
  },

  // Get club members
  getClubMembers: (clubId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT cm.*, u.username, u.displayName, u.profileImage
        FROM club_members cm
        JOIN users u ON cm.userId = u.id
        WHERE cm.clubId = ?
        ORDER BY 
          CASE cm.role 
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'member' THEN 3
          END,
          cm.joinedAt ASC
      `, [clubId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Add photo to club
  addPhotoToClub: (clubId, photoId, userId) => {
    return new Promise((resolve, reject) => {
      const { v4: uuidv4 } = require('uuid');
      const clubPhotoId = uuidv4();
      
      db.run(`
        INSERT INTO club_photos (id, clubId, photoId, postedBy)
        VALUES (?, ?, ?, ?)
      `, [clubPhotoId, clubId, photoId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          // Update photo count
          db.run(`
            UPDATE clubs SET photoCount = photoCount + 1 WHERE id = ?
          `, [clubId], (updateErr) => {
            if (updateErr) reject(updateErr);
            else resolve({ success: true, clubPhotoId });
          });
        }
      });
    });
  },

  // Get photos for club
  getClubPhotos: (clubId, limit = 20, offset = 0) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, cp.postedAt, u.username as postedByUsername, u.displayName as postedByDisplayName
        FROM club_photos cp
        JOIN photos p ON cp.photoId = p.id
        JOIN users u ON cp.postedBy = u.id
        WHERE cp.clubId = ?
        ORDER BY cp.postedAt DESC
        LIMIT ? OFFSET ?
      `, [clubId, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Update club info
  updateClub: (clubId, updateData) => {
    return new Promise((resolve, reject) => {
      const { name, description, coverImage, isPrivate } = updateData;
      db.run(`
        UPDATE clubs 
        SET name = ?, description = ?, coverImage = ?, isPrivate = ?
        WHERE id = ?
      `, [name, description, coverImage, isPrivate, clubId], function(err) {
        if (err) {
          reject(err);
        } else {
          clubOperations.getClubById(clubId)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },

  // Delete club
  deleteClub: (clubId) => {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM clubs WHERE id = ?
      `, [clubId], function(err) {
        if (err) reject(err);
        else resolve({ success: true });
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
  ...commentOperations,
  ...clubOperations
};