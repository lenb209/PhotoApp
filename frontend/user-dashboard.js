// Dashboard JavaScript - User Dashboard Functionality

class Dashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentMedia = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.currentSection = 'feed';
        this.feedData = [];
        this.followingData = [];
        this.init();
    }

    async init() {
        // TEMP: Skip authentication for live server testing
        // Check authentication first
        await this.checkAuthStatus();
        
        // TEMP: Comment out redirect for live server testing
        // if (!this.isAuthenticated) {
        //     // Redirect to login if not authenticated
        //     window.location.href = 'index.html';
        //     return;
        // }
        
        // Set dummy user for testing
        this.currentUser = {
            id: 1,
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com'
        };
        this.isAuthenticated = true;
        
        this.bindEvents();
        this.updateUserProfile();
        this.loadFeedData();
        this.loadFollowingData();
        this.showSection('feed');
    }

    // Event Bindings
    bindEvents() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Header buttons
        document.getElementById('uploadMediaBtn')?.addEventListener('click', () => {
            this.showUploadModal();
        });

        document.getElementById('profileBtn')?.addEventListener('click', () => {
            this.showSection('profile');
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Feed filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterFeed(e.target.dataset.filter);
            });
        });

        // Upload tabs
        document.querySelectorAll('.upload-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchUploadType(type);
            });
        });

        // Upload forms
        document.getElementById('photoUploadForm')?.addEventListener('submit', (e) => {
            this.handlePhotoUpload(e);
        });

        document.getElementById('videoUploadForm')?.addEventListener('submit', (e) => {
            this.handleVideoUpload(e);
        });

        // Profile form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });

        // Search users
        document.getElementById('searchUsersBtn')?.addEventListener('click', () => {
            this.searchUsers();
        });

        document.getElementById('userSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });

        // Modal events
        document.getElementById('uploadModalClose')?.addEventListener('click', () => {
            this.closeUploadModal();
        });

        document.getElementById('uploadModalOverlay')?.addEventListener('click', () => {
            this.closeUploadModal();
        });

        // Load more
        document.getElementById('loadMoreFeed')?.addEventListener('click', () => {
            this.loadMoreFeed();
        });

        // File input changes
        document.getElementById('photoFile')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Club events
        document.getElementById('createClubBtn')?.addEventListener('click', () => {
            this.showCreateClubModal();
        });

        document.getElementById('createClubForm')?.addEventListener('submit', (e) => {
            this.handleClubCreation(e);
        });

        // Club tabs
        document.querySelectorAll('.club-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.switchClubTab(filter);
            });
        });

        // Club discover filters
        document.querySelectorAll('.clubs-content .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterDiscoverClubs(filter);
            });
        });

        document.getElementById('loadMoreClubs')?.addEventListener('click', () => {
            this.loadMoreClubs();
        });

        // Modal close events for club modal
        document.querySelectorAll('#createClubModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeCreateClubModal();
            });
        });

        document.querySelector('#createClubModal .modal-overlay')?.addEventListener('click', () => {
            this.closeCreateClubModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
                this.closeCreateClubModal();
            }
        });
    }

    // Navigation Methods
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentSection = sectionName;
        
        // Load section-specific data
        switch (sectionName) {
            case 'feed':
                this.loadFeedData();
                break;
            case 'my-content':
                this.loadMyContent();
                break;
            case 'following':
                this.loadFollowingData();
                break;
            case 'clubs':
                this.loadClubsData();
                break;
            case 'profile':
                this.loadProfileData();
                break;
        }
    }

    // Upload Modal Methods
    showUploadModal() {
        document.getElementById('uploadModal')?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeUploadModal() {
        document.getElementById('uploadModal')?.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.resetUploadForms();
    }

    switchUploadType(type) {
        document.querySelectorAll('.upload-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            }
        });

        document.querySelectorAll('.upload-form').forEach(form => {
            form.classList.remove('active');
        });

        const targetForm = document.getElementById(type + 'UploadForm');
        if (targetForm) {
            targetForm.classList.add('active');
        }
    }

    resetUploadForms() {
        document.getElementById('photoUploadForm')?.reset();
        document.getElementById('videoUploadForm')?.reset();
        
        // Reset featured stream checkbox to checked (default)
        const featuredCheckbox = document.getElementById('featuredStream');
        if (featuredCheckbox) {
            featuredCheckbox.checked = true;
        }
        
        const fileInputArea = document.querySelector('.file-input-area p');
        if (fileInputArea) {
            fileInputArea.textContent = 'Click to select a photo or drag and drop';
        }
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // File Handling
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File size must be less than 10MB', 'error');
            return;
        }

        // Validate image dimensions
        this.validateImageDimensions(file);

        // Update UI to show selected file
        const fileName = file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
        document.querySelector('.file-input-area p').textContent = `Selected: ${fileName}`;

        // Auto-fill title if empty
        const titleInput = document.getElementById('photoTitle');
        if (!titleInput.value) {
            titleInput.value = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        }
    }

    validateImageDimensions(file) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            const maxDimension = Math.max(img.width, img.height);
            
            if (maxDimension > 2048) {
                this.showToast(`Image too large! Maximum dimension is 2048px, but your image is ${maxDimension}px. Please resize before uploading.`, 'error');
                document.getElementById('photoFile').value = '';
                document.querySelector('.file-input-area p').textContent = 'Click to select a photo or drag and drop';
            } else {
                this.showToast(`Image dimensions: ${img.width}x${img.height}px ✓`, 'success');
            }
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
            this.showToast('Could not read image dimensions', 'error');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    // Upload Handling Methods
    async handlePhotoUpload(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('photoFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Please select a photo to upload', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('title', document.getElementById('photoTitle').value || file.name);
        formData.append('description', document.getElementById('photoDescription').value || '');
        formData.append('tags', document.getElementById('photoTags').value || '');
        formData.append('featuredStream', document.getElementById('featuredStream').checked);

        this.showLoading();

        try {
            const response = await fetch('/api/photos', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showToast('Photo uploaded successfully!');
                this.closeUploadModal();
                if (this.currentSection === 'my-content') {
                    this.loadMyContent();
                } else if (this.currentSection === 'feed') {
                    this.loadFeedData();
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast(error.message || 'Failed to upload photo', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleVideoUpload(e) {
        e.preventDefault();
        
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const videoTitle = document.getElementById('videoTitle').value.trim();
        
        if (!videoUrl) {
            this.showToast('Please enter a YouTube video URL', 'error');
            return;
        }

        if (!this.isValidYouTubeUrl(videoUrl)) {
            this.showToast('Please enter a valid YouTube URL', 'error');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: videoUrl,
                    title: videoTitle || 'Untitled Video',
                    description: document.getElementById('videoDescription').value || ''
                })
            });

            if (response.ok) {
                this.showToast('Video posted successfully!');
                this.closeUploadModal();
                if (this.currentSection === 'my-content') {
                    this.loadMyContent();
                } else if (this.currentSection === 'feed') {
                    this.loadFeedData();
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Video post failed');
            }
        } catch (error) {
            console.error('Video post error:', error);
            this.showToast(error.message || 'Failed to post video', 'error');
        } finally {
            this.hideLoading();
        }
    }

    isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value.trim(),
            displayName: document.getElementById('displayName').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            location: document.getElementById('location').value.trim(),
            website: document.getElementById('website').value.trim()
        };

        this.showLoading();

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                this.user = { ...this.user, ...updatedUser };
                this.showToast('Profile updated successfully!');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Profile update failed');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Data Loading Methods
    async loadFeedData() {
        try {
            // TEMP: Use mock data for live server testing
            const mockPhotos = [
                {
                    id: 1,
                    title: "Sample Photo 1",
                    description: "A beautiful landscape photo",
                    filename: "sample1.jpg",
                    uploadDate: new Date().toISOString()
                },
                {
                    id: 2,
                    title: "Sample Photo 2", 
                    description: "An amazing sunset",
                    filename: "sample2.jpg",
                    uploadDate: new Date().toISOString()
                }
            ];
            
            this.displayFeedPhotos(mockPhotos);
            
            // Original API code (commented for live server testing):
            // const response = await fetch('/api/photos');
            // if (!response.ok) throw new Error('Failed to fetch feed');
            // const photos = await response.json();
            // this.displayFeedPhotos(photos);
        } catch (error) {
            console.error('Error loading feed:', error);
            const feedGrid = document.querySelector('.feed-grid');
            if (feedGrid) {
                feedGrid.innerHTML = '<div class="error">Failed to load feed</div>';
            }
        }
    }

    async loadMyContent() {
        try {
            // TEMP: Use mock data for live server testing
            const mockPhotos = [
                {
                    id: 1,
                    title: "My Photo 1",
                    description: "My first upload",
                    filename: "my-photo1.jpg",
                    uploadDate: new Date().toISOString()
                }
            ];
            
            const mockVideos = [
                {
                    id: 1,
                    title: "My Video 1",
                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    uploadDate: new Date().toISOString()
                }
            ];
            
            this.displayMyPhotos(mockPhotos);
            this.displayMyVideos(mockVideos);
            this.updateItemCount('photoCount', mockPhotos.length, 'photo');
            this.updateItemCount('videoCount', mockVideos.length, 'video');
            
            // Original API code (commented for live server testing):
            // const photosResponse = await fetch('/api/photos?user=current');
            // if (photosResponse.ok) {
            //     const photos = await photosResponse.json();
            //     this.displayMyPhotos(photos);
            //     this.updateItemCount('photoCount', photos.length, 'photo');
            // }
            // const videosResponse = await fetch('/api/videos?user=current');
            // if (videosResponse.ok) {
            //     const videos = await videosResponse.json();
            //     this.displayMyVideos(videos);
            //     this.updateItemCount('videoCount', videos.length, 'video');
            // }
        } catch (error) {
            console.error('Error loading user content:', error);
        }
    }

    async loadFollowingData() {
        try {
            // Load following list - for now, show mock data
            const followingList = document.querySelector('.following-list');
            if (followingList) {
                followingList.innerHTML = `
                    <div class="empty-state">
                        <p>You're not following anyone yet.</p>
                        <p>Start following photographers to see their content in your feed!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading following data:', error);
        }
    }

    async loadProfileData() {
        try {
            // Load current user's profile data
            this.user = {
                id: 1,
                username: 'photographer',
                displayName: 'Photographer',
                bio: 'Capturing moments through my lens',
                location: 'New York, NY',
                website: 'https://myportfolio.com',
                joinDate: '2024',
                photoCount: 0,
                followerCount: 0,
                followingCount: 0
            };

            this.updateProfileDisplay();
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    updateProfileDisplay() {
        // Update profile form with current user data
        const profileForm = document.getElementById('profileForm');
        if (profileForm && this.user) {
            profileForm.querySelector('#username').value = this.user.username || '';
            profileForm.querySelector('#displayName').value = this.user.displayName || '';
            profileForm.querySelector('#bio').value = this.user.bio || '';
            profileForm.querySelector('#location').value = this.user.location || '';
            profileForm.querySelector('#website').value = this.user.website || '';
        }
    }

    displayFeedPhotos(photos) {
        const feedGrid = document.querySelector('.feed-grid');
        if (!feedGrid) return;

        if (photos.length === 0) {
            feedGrid.innerHTML = `
                <div class="empty-state">
                    <p>Your feed is empty!</p>
                    <p>Follow some photographers to see their content here.</p>
                </div>
            `;
            return;
        }

        feedGrid.innerHTML = photos.map(photo => this.createFeedCard(photo)).join('');
    }

    displayMyPhotos(photos) {
        const photosGrid = document.getElementById('myPhotoGallery');
        if (!photosGrid) return;

        if (photos.length === 0) {
            photosGrid.innerHTML = `
                <div class="empty-state">
                    <p>You haven't uploaded any photos yet.</p>
                    <button class="btn-primary" onclick="dashboard.showUploadModal()">Upload Your First Photo</button>
                </div>
            `;
            return;
        }

        photosGrid.innerHTML = photos.map(photo => this.createPhotoCard(photo)).join('');
    }

    displayMyVideos(videos) {
        const videosGrid = document.getElementById('myVideoGallery');
        if (!videosGrid) return;

        if (videos.length === 0) {
            videosGrid.innerHTML = `
                <div class="empty-state">
                    <p>You haven't posted any videos yet.</p>
                    <button class="btn-primary" onclick="dashboard.showUploadModal()">Share Your First Video</button>
                </div>
            `;
            return;
        }

        videosGrid.innerHTML = videos.map(video => this.createVideoCard(video)).join('');
    }

    updateItemCount(elementId, count, itemType) {
        const countElement = document.getElementById(elementId);
        if (countElement) {
            if (count === 0) {
                countElement.textContent = `0 ${itemType}s`;
            } else if (count === 1) {
                countElement.textContent = `1 ${itemType}`;
            } else {
                countElement.textContent = `${count} ${itemType}s`;
            }
        }
    }

    createFeedCard(photo) {
        const uploadDate = new Date(photo.uploadDate).toLocaleDateString();
        
        return `
            <div class="feed-item" data-photo-id="${photo.id}">
                <div class="feed-header">
                    <div class="user-info">
                        <div class="user-avatar">📷</div>
                        <div class="user-details">
                            <div class="username">photographer</div>
                            <div class="post-time">${uploadDate}</div>
                        </div>
                    </div>
                </div>
                <div class="feed-image">
                    <div style="width: 100%; height: 300px; background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">📸</div>
                </div>
                <div class="feed-content">
                    <h4>${this.escapeHtml(photo.title)}</h4>
                    <p>${this.escapeHtml(photo.description || '')}</p>
                </div>
            </div>
        `;
    }

    createPhotoCard(photo) {
        const uploadDate = new Date(photo.uploadDate).toLocaleDateString();

        return `
            <div class="media-item photo" data-photo-id="${photo.id}">
                <div style="width: 100%; height: 200px; background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">📸</div>
                <div class="media-overlay">
                    <div class="media-title">${this.escapeHtml(photo.title)}</div>
                    <div class="media-date">${uploadDate}</div>
                </div>
            </div>
        `;
    }

    createVideoCard(video) {
        const uploadDate = new Date(video.uploadDate || video.createdDate).toLocaleDateString();
        const videoId = this.extractYouTubeId(video.url);
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        return `
            <div class="media-item video" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${thumbnailUrl}" alt="${video.title}" loading="lazy">
                    <div class="play-overlay">▶️</div>
                </div>
                <div class="media-overlay">
                    <div class="media-title">${this.escapeHtml(video.title)}</div>
                    <div class="media-date">${uploadDate}</div>
                </div>
            </div>
        `;
    }

    extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        return match ? match[1] : '';
    }

    updatePhotoCount(count) {
        const countElement = document.getElementById('photoCount');
        countElement.textContent = count === 0 ? 'No photos' : 
            count === 1 ? '1 photo' : `${count} photos`;
    }

    // Following System Methods
    async handleFollowUser(username) {
        try {
            const response = await fetch('/api/users/follow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                this.showToast(`Now following ${username}!`);
                if (this.currentSection === 'following') {
                    this.loadFollowingData();
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Follow failed');
            }
        } catch (error) {
            console.error('Follow error:', error);
            this.showToast(error.message || 'Failed to follow user', 'error');
        }
    }

    async handleUnfollowUser(username) {
        try {
            const response = await fetch('/api/users/unfollow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                this.showToast(`Unfollowed ${username}`);
                if (this.currentSection === 'following') {
                    this.loadFollowingData();
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Unfollow failed');
            }
        } catch (error) {
            console.error('Unfollow error:', error);
            this.showToast(error.message || 'Failed to unfollow user', 'error');
        }
    }

    // Utility Methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Club Methods
    async loadClubsData() {
        this.loadMyClubs();
        this.loadDiscoverClubs();
    }

    async loadMyClubs() {
        try {
            // TEMP: Use mock data for live server testing
            const mockClubs = [
                {
                    id: 1,
                    name: "Landscape Photography Club",
                    description: "For lovers of landscape photography",
                    memberCount: 15,
                    photoCount: 45,
                    creatorDisplayName: "Test User",
                    role: "owner",
                    isPrivate: false
                }
            ];
            
            this.displayMyClubs(mockClubs);
            
            // Original API code (commented for live server testing):
            // const response = await fetch(`${this.apiBaseUrl}/clubs/user/${this.currentUser.id}`, {
            //     credentials: 'include'
            // });
            // if (response.ok) {
            //     const clubs = await response.json();
            //     this.displayMyClubs(clubs);
            // } else {
            //     this.showToast('Failed to load your clubs', 'error');
            // }
        } catch (error) {
            console.error('Error loading my clubs:', error);
            this.showToast('Failed to load your clubs', 'error');
        }
    }

    async loadDiscoverClubs() {
        try {
            // TEMP: Use mock data for live server testing
            const mockClubs = [
                {
                    id: 2,
                    name: "Street Photography",
                    description: "Urban photography enthusiasts",
                    memberCount: 28,
                    photoCount: 120,
                    creatorDisplayName: "Street Photographer",
                    isPrivate: false
                },
                {
                    id: 3,
                    name: "Portrait Masters",
                    description: "Professional portrait photography",
                    memberCount: 42,
                    photoCount: 89,
                    creatorDisplayName: "Portrait Pro",
                    isPrivate: true
                }
            ];
            
            this.displayDiscoverClubs(mockClubs);
            
            // Original API code (commented for live server testing):
            // const response = await fetch(`${this.apiBaseUrl}/clubs`, {
            //     credentials: 'include'
            // });
            // if (response.ok) {
            //     const clubs = await response.json();
            //     this.displayDiscoverClubs(clubs);
            // } else {
            //     this.showToast('Failed to load clubs', 'error');
            // }
        } catch (error) {
            console.error('Error loading discover clubs:', error);
            this.showToast('Failed to load clubs', 'error');
        }
    }

    displayMyClubs(clubs) {
        const container = document.getElementById('myClubsList');
        if (!container) return;

        if (clubs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Clubs Yet</h3>
                    <p>You haven't joined any photography clubs yet.</p>
                    <button class="btn-primary" onclick="document.querySelector('[data-filter=\"discover\"]').click()">Discover Clubs</button>
                </div>
            `;
            return;
        }

        container.innerHTML = clubs.map(club => this.createClubCard(club, true)).join('');
    }

    displayDiscoverClubs(clubs) {
        const container = document.getElementById('discoverClubsList');
        if (!container) return;

        container.innerHTML = clubs.map(club => this.createClubCard(club, false)).join('');
    }

    createClubCard(club, isUserClub) {
        const memberText = club.memberCount === 1 ? 'member' : 'members';
        const photoText = club.photoCount === 1 ? 'photo' : 'photos';
        
        return `
            <div class="club-card" data-club-id="${club.id}">
                <div class="club-cover" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-light));">
                    ${club.coverImage ? `<img src="${club.coverImage}" alt="${this.escapeHtml(club.name)}">` : ''}
                </div>
                <div class="club-info">
                    <h3 class="club-name">${this.escapeHtml(club.name)}</h3>
                    <p class="club-description">${this.escapeHtml(club.description || 'No description')}</p>
                    <div class="club-stats">
                        <span>${club.memberCount} ${memberText}</span>
                        <span>${club.photoCount} ${photoText}</span>
                        ${club.isPrivate ? '<span class="private-badge">Private</span>' : ''}
                    </div>
                    <div class="club-meta">
                        <span>by ${this.escapeHtml(club.creatorDisplayName || club.creatorUsername)}</span>
                        ${isUserClub ? `<span class="user-role">${club.role}</span>` : ''}
                    </div>
                </div>
                <div class="club-actions">
                    <button class="btn-primary btn-sm" onclick="window.location.href='club.html?id=${club.id}'">
                        View Club
                    </button>
                </div>
            </div>
        `;
    }

    switchClubTab(filter) {
        // Update tab buttons
        document.querySelectorAll('.club-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.clubs-content').forEach(content => {
            content.classList.remove('active');
        });

        if (filter === 'my-clubs') {
            document.getElementById('myClubsContent').classList.add('active');
        } else {
            document.getElementById('discoverContent').classList.add('active');
        }
    }

    filterDiscoverClubs(filter) {
        // Update filter buttons
        document.querySelectorAll('.discover-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.discover-filters [data-filter="${filter}"]`).classList.add('active');

        // TODO: Implement filtering logic
        console.log('Filter discover clubs by:', filter);
    }

    showCreateClubModal() {
        const modal = document.getElementById('createClubModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeCreateClubModal() {
        const modal = document.getElementById('createClubModal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset form
        document.getElementById('createClubForm').reset();
    }

    async handleClubCreation(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const clubData = {
                name: formData.get('name'),
                description: formData.get('description'),
                isPrivate: formData.get('isPrivate') === 'on'
            };

            this.showLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/clubs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(clubData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeCreateClubModal();
                
                // Redirect to the new club page
                setTimeout(() => {
                    window.location.href = `club.html?id=${result.club.id}`;
                }, 1500);
            } else {
                this.showToast(result.error || 'Failed to create club', 'error');
            }
        } catch (error) {
            console.error('Error creating club:', error);
            this.showToast('Failed to create club', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadMoreClubs() {
        // TODO: Implement pagination for clubs
        console.log('Load more clubs - to be implemented');
    }

    // Authentication Methods
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/status`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.authenticated) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                return true;
            } else {
                this.isAuthenticated = false;
                return false;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isAuthenticated = false;
            return false;
        }
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        // Update profile section with user data
        const profileUsername = document.getElementById('profileUsername');
        const profileEmail = document.getElementById('profileEmail');
        const profileDisplayName = document.getElementById('profileDisplayName');
        const profileBio = document.getElementById('profileBio');

        if (profileUsername) profileUsername.textContent = this.currentUser.username;
        if (profileEmail) profileEmail.textContent = this.currentUser.email;
        if (profileDisplayName) profileDisplayName.value = this.currentUser.displayName || '';
        if (profileBio) profileBio.value = this.currentUser.bio || '';

        // Update header with user info
        const userAvatar = document.querySelector('.user-avatar');
        const userName = document.querySelector('.user-name');
        
        if (userName) userName.textContent = this.currentUser.displayName || this.currentUser.username;
        if (userAvatar && this.currentUser.profileImage) {
            userAvatar.src = this.currentUser.profileImage;
        }
    }

    async handleLogout() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.showToast('Logged out successfully', 'success');
                
                // Redirect to homepage
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showToast('Logout failed', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    // Check server status
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (!response.ok) {
                throw new Error('Server not responding');
            }
            return true;
        } catch (error) {
            this.showToast('Unable to connect to server. Please make sure the backend is running.', 'error');
            return false;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    
    // Check server status on load
    dashboard.checkServerStatus();
});