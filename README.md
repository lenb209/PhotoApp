# Photo Sharing App

A basic photo sharing application with upload and gallery functionality built with Node.js and vanilla JavaScript.

## Features

- 📸 **Photo Upload**: Drag & drop or click to upload images (JPG, PNG, GIF, WebP)
- 🖼️ **Image Processing**: Automatic thumbnail generation and image optimization
- 📱 **Responsive Gallery**: Beautiful grid layout that works on all devices
- 🔍 **Photo Viewer**: Full-size photo viewing with details
- 🗑️ **Photo Management**: Delete photos with confirmation
- 💾 **SQLite Database**: Lightweight database for photo metadata
- ⚡ **Real-time UI**: Toast notifications and loading states
- 🎨 **Modern Design**: Clean, modern interface with smooth animations

## Screenshots

The app features a beautiful gradient background with a clean, modern interface:
- Upload section with drag-and-drop functionality
- Responsive photo grid gallery
- Modal photo viewer with metadata
- Toast notifications for user feedback

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. **Clone or download the project**
   ```bash
   cd PhotoApp
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm run dev
   ```
   The server will start on http://localhost:3000

4. **Open the app**
   - Navigate to http://localhost:3000 in your browser
   - Or open `frontend/index.html` directly if serving static files

### Development

- **Backend development**: Use `npm run dev` in the backend folder for auto-restart
- **Frontend development**: Modify files in the frontend folder and refresh the browser

## Project Structure

```
PhotoApp/
├── backend/                 # Express.js API server
│   ├── database/           # Database models and operations
│   │   └── db.js          # SQLite database setup
│   ├── routes/            # API route handlers
│   │   └── photos.js      # Photo upload/retrieval routes
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
├── frontend/              # Client-side application
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── app.js            # JavaScript functionality
├── data/                 # SQLite database files (auto-created)
├── uploads/              # Uploaded photos storage (auto-created)
├── .gitignore           # Git ignore rules
├── package.json         # Project metadata
└── README.md           # This file
```

## API Endpoints

### Photos
- `GET /api/photos` - Get all photos with metadata
- `POST /api/photos` - Upload a new photo
  - Accepts multipart/form-data with `photo` file
  - Optional: `title` and `description` fields
- `GET /api/photos/:id` - Get specific photo by ID
- `DELETE /api/photos/:id` - Delete a photo and its files

### Health Check
- `GET /api/health` - Server status check

### Static Files
- `GET /uploads/:filename` - Serve uploaded photos
- `GET /static/*` - Serve frontend assets

## Image Processing

The app automatically processes uploaded images:

- **Original Images**: Resized to max 1920x1080px while maintaining aspect ratio
- **Thumbnails**: 300x300px square thumbnails with smart cropping
- **Quality**: JPEG compression with 85% quality for originals, 70% for thumbnails
- **File Size Limit**: 10MB maximum upload size

## Technologies Used

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **SQLite3** - Lightweight database
- **Multer** - File upload handling
- **Sharp** - Image processing and thumbnail generation
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique ID generation

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox
- **JavaScript (ES6+)** - Client-side functionality
- **Fetch API** - HTTP requests
- **File API** - File handling and validation

## Configuration

Environment variables (backend/.env):
```
PORT=3000
DB_PATH=./data/photos.db
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp
THUMBNAIL_SIZE=300
MAX_IMAGE_WIDTH=1920
MAX_IMAGE_HEIGHT=1080
IMAGE_QUALITY=85
```

## Database Schema

### Photos Table
```sql
CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    thumbnailFilename TEXT NOT NULL,
    originalName TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- File type validation (images only)
- File size limits
- Unique filename generation to prevent conflicts
- SQL injection protection with parameterized queries
- XSS protection with HTML escaping

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if Node.js is installed: `node --version`
   - Ensure port 3000 is available
   - Check backend dependencies: `npm install`

2. **Photos won't upload**
   - Verify file is under 10MB
   - Ensure file is a valid image format
   - Check browser console for errors

3. **Images not displaying**
   - Verify backend server is running
   - Check uploads folder permissions
   - Ensure database is accessible

### Log Files

Server logs are displayed in the console when running `npm run dev`.

## Future Enhancements

Potential features for future versions:
- User authentication and accounts
- Photo categories/tags
- Image editing capabilities
- Social sharing features
- Batch upload
- Search functionality
- Photo comments
- User profiles

## License

MIT License - feel free to use this project for learning or as a starting point for your own photo sharing application.

## Contributing

This is a basic example project, but contributions are welcome! Please feel free to submit issues and pull requests.