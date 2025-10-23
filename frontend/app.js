// Photo Sharing App Landing Page JavaScript

class PhotoShareLanding {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentPhoto = null;
        this.streamPhotos = [];
        this.displayedPhotos = 6; // Start with 6 photos
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.loadStreamingFeed();
        this.updatePhotoStats();
    }

    // Event Bindings
    bindEvents() {
        // Login button in header
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.showLoginModal();
        });

        // Sign up form
        document.getElementById('signUpForm')?.addEventListener('submit', (e) => {
            this.handleSignUp(e);
        });

        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Load more photos
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            this.loadMorePhotos();
        });

        // Sign in link
        document.getElementById('signInLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeLoginModal();
            this.showLoginModal();
        });

        // Sign up link
        document.getElementById('signUpLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeLoginModal();
            document.getElementById('signUpSection').scrollIntoView({ behavior: 'smooth' });
        });

        // Modal events for photo viewing
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalOverlay')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Login modal events
        document.getElementById('loginModalClose')?.addEventListener('click', () => {
            this.closeLoginModal();
        });

        document.getElementById('loginModalOverlay')?.addEventListener('click', () => {
            this.closeLoginModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeLoginModal();
            }
        });
    }

    // Streaming Photo Feed
    async loadStreamingFeed() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/photos/featured`);
            const photos = await response.json();
            
            this.streamPhotos = photos;
            this.displayStreamPhotos();
        } catch (error) {
            console.error('Error loading featured photo stream:', error);
            this.showDefaultPhotos();
        }
    }

    displayStreamPhotos() {
        const stream = document.getElementById('photoStream');
        if (!stream) return;

        const photosToShow = this.streamPhotos.slice(0, this.displayedPhotos);
        
        if (photosToShow.length === 0) {
            stream.innerHTML = this.getEmptyStreamHTML();
            return;
        }

        stream.innerHTML = photosToShow.map(photo => this.createStreamPhotoCard(photo)).join('');

        // Add click events to stream photos
        stream.querySelectorAll('.stream-photo').forEach((card, index) => {
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking action buttons
                if (e.target.closest('.action-btn')) return;
                this.openModal(photosToShow[index]);
            });
        });

        // Load like and comment counts for visible photos
        photosToShow.forEach(photo => {
            this.loadPhotoStats(photo.id);
        });

        // Initialize masonry layout after images load
        this.initMasonryLayout();

        // Update load more button
        this.updateLoadMoreButton();
    }

    createStreamPhotoCard(photo) {
        const uploadDate = new Date(photo.uploadDate).toLocaleDateString();
        
        return `
            <div class="stream-photo" data-photo-id="${photo.id}">
                <img src="/uploads/${photo.thumbnailFilename}" alt="${photo.title}" loading="lazy">
                <div class="stream-photo-info">
                    <div class="stream-photo-title">${this.escapeHtml(photo.title)}</div>
                    <div class="stream-photo-meta">
                        <span>${uploadDate}</span>
                        <span>${this.formatFileSize(photo.fileSize)}</span>
                    </div>
                    <div class="stream-photo-actions">
                        <button class="action-btn like-btn" data-photo-id="${photo.id}" onclick="photoApp.toggleLike('${photo.id}', this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span class="like-count">0</span>
                        </button>
                        <button class="action-btn comment-btn" data-photo-id="${photo.id}" onclick="photoApp.showComments('${photo.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span class="comment-count">0</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getEmptyStreamHTML() {
        return `
            <div class="empty-stream">
                <div style="text-align: center; padding: 3rem; color: #6b7280;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; color: #d1d5db;">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21,15 16,10 5,21"></polyline>
                    </svg>
                    <h3 style="margin-bottom: 0.5rem; color: #374151;">No photos in the stream yet</h3>
                    <p>Be the first to share a photo with the community!</p>
                </div>
            </div>
        `;
    }

    loadMorePhotos() {
        this.displayedPhotos += 6;
        this.displayStreamPhotos();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;

        if (this.displayedPhotos >= this.streamPhotos.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-flex';
        }
    }

    // Photo Statistics
    async updatePhotoStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/photos`);
            const photos = await response.json();
            
            const totalPhotosElement = document.getElementById('totalPhotos');
            if (totalPhotosElement) {
                totalPhotosElement.textContent = photos.length.toLocaleString();
            }
            
            // Update user stats
            await this.updateUserStats();
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // User Statistics
    async updateUserStats() {
        try {
            // Try to get user count from backend
            const response = await fetch(`${this.apiBaseUrl}/users/count`);
            if (response.ok) {
                const data = await response.json();
                const totalUsersElement = document.getElementById('totalUsers');
                if (totalUsersElement) {
                    totalUsersElement.textContent = this.formatNumber(data.count);
                }
            } else {
                // Fallback: simulate user count based on photos + base number
                const photosResponse = await fetch(`${this.apiBaseUrl}/photos`);
                const photos = await photosResponse.json();
                
                // Simulate user count (photos * 0.3 + base of 150)
                const simulatedUserCount = Math.floor(photos.length * 0.3) + 150;
                const totalUsersElement = document.getElementById('totalUsers');
                if (totalUsersElement) {
                    totalUsersElement.textContent = this.formatNumber(simulatedUserCount);
                }
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
            // Keep default fallback value if API fails
            const totalUsersElement = document.getElementById('totalUsers');
            if (totalUsersElement && totalUsersElement.textContent === '0') {
                totalUsersElement.textContent = '1.2K';
            }
        }
    }

    // Format numbers for display (e.g., 1200 -> 1.2K)
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    }

    // Photo Modal (reused from gallery)
    openModal(photo) {
        this.currentPhoto = photo;
        
        // Create modal if it doesn't exist
        this.ensureModalExists();
        
        document.getElementById('modalImage').src = `/uploads/${photo.filename}`;
        document.getElementById('modalTitle').textContent = photo.title;
        document.getElementById('modalDescription').textContent = photo.description || 'No description';
        
        const uploadDate = new Date(photo.uploadDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('modalDate').textContent = `Uploaded: ${uploadDate}`;
        document.getElementById('modalSize').textContent = `Size: ${this.formatFileSize(photo.fileSize)}`;
        
        document.getElementById('photoModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            this.currentPhoto = null;
        }
    }

    ensureModalExists() {
        if (document.getElementById('photoModal')) return;

        const modalHTML = `
            <div id="photoModal" class="modal hidden">
                <div class="modal-overlay" id="modalOverlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="modalClose">&times;</button>
                    <div class="modal-body">
                        <img id="modalImage" src="" alt="">
                        <div class="modal-info">
                            <h3 id="modalTitle"></h3>
                            <p id="modalDescription"></p>
                            <div class="modal-meta">
                                <span id="modalDate"></span>
                                <span id="modalSize"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Rebind modal events
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', () => this.closeModal());
    }

    // Sign Up Functionality
    scrollToSignUp() {
        document.getElementById('signUpSection')?.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    async handleSignUp(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Basic validation
        if (!userData.firstName || !userData.lastName || !userData.username || 
            !userData.email || !userData.password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (userData.password.length < 8) {
            this.showToast('Password must be at least 8 characters', 'error');
            return;
        }

        this.showLoading();

        try {
            // For now, simulate successful signup
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showToast('Account created successfully! Welcome to PhotoShare!', 'success');
            e.target.reset();
            
            // Redirect to gallery after successful signup
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Sign up error:', error);
            this.showToast('Failed to create account. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showLoginModal() {
        // Create and show a login modal
        this.createLoginModal();
        document.getElementById('loginModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    createLoginModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('loginModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="loginModal" class="modal hidden">
                <div class="modal-overlay" id="loginModalOverlay"></div>
                <div class="modal-content" style="max-width: 400px;">
                    <button class="modal-close" id="loginModalClose">&times;</button>
                    <div class="modal-body" style="padding: 2rem;">
                        <h2 style="text-align: center; margin-bottom: 1.5rem; color: #1f2937;">Welcome Back</h2>
                        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
                            <div class="form-group">
                                <label for="loginEmail">Email Address</label>
                                <input type="email" id="loginEmail" name="email" placeholder="your@email.com" required>
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" name="password" placeholder="Enter your password" required>
                            </div>
                            <button type="submit" class="btn-primary btn-large" style="margin-top: 1rem;">Sign In</button>
                        </form>
                        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
                            <p>Don't have an account? <a href="#signUpSection" class="link" id="goToSignUp">Sign up below</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Bind events for the login modal
        document.getElementById('loginModalClose').addEventListener('click', () => this.closeLoginModal());
        document.getElementById('loginModalOverlay').addEventListener('click', () => this.closeLoginModal());
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('goToSignUp').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeLoginModal();
            this.scrollToSignUp();
        });
    }

    closeLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Basic validation
        if (!loginData.email || !loginData.password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        this.showLoading();

        try {
            // For now, simulate successful login
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showToast('Login successful! Redirecting...', 'success');
            this.closeLoginModal();
            
            // Redirect to gallery after successful login
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Invalid email or password. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // UI Helper Methods
    showLoading() {
        this.ensureLoadingExists();
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loadingSpinner');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    ensureLoadingExists() {
        if (document.getElementById('loadingSpinner')) return;

        const loadingHTML = `
            <div id="loadingSpinner" class="loading-spinner hidden">
                <div class="spinner"></div>
                <p>Processing...</p>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    showToast(message, type = 'success') {
        this.ensureToastExists();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    ensureToastExists() {
        if (document.getElementById('toastContainer')) return;

        const toastHTML = `<div id="toastContainer" class="toast-container"></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    // Utility Methods
    // Like and Comment functionality
    async toggleLike(photoId, buttonElement) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/likes/${photoId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                
                // Update button state
                if (result.liked) {
                    buttonElement.classList.add('liked');
                } else {
                    buttonElement.classList.remove('liked');
                }
                
                // Update count
                const countSpan = buttonElement.querySelector('.like-count');
                countSpan.textContent = result.likeCount;
                
                // Add animation
                buttonElement.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    buttonElement.style.transform = 'scale(1)';
                }, 150);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async showComments(photoId) {
        try {
            // Load comments
            const response = await fetch(`${this.apiBaseUrl}/comments/${photoId}`);
            const comments = await response.json();
            
            // Show comment modal
            this.openCommentModal(photoId, comments);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    openCommentModal(photoId, comments) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content comment-modal">
                <div class="modal-header">
                    <h3>Comments</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="comments-container">
                    ${comments.length > 0 ? comments.map(comment => this.createCommentHTML(comment)).join('') : '<p class="no-comments">No comments yet. Be the first to comment!</p>'}
                </div>
                <div class="comment-form">
                    <input type="text" id="commentUsername" placeholder="Your name (optional)" maxlength="50">
                    <textarea id="commentText" placeholder="Write a comment..." rows="3" maxlength="500"></textarea>
                    <div class="comment-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn-primary" onclick="photoApp.addComment('${photoId}', this)">Post Comment</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    createCommentHTML(comment) {
        const date = new Date(comment.createdAt).toLocaleDateString();
        return `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-username">${this.escapeHtml(comment.username)}</span>
                    <span class="comment-date">${date}</span>
                </div>
                <div class="comment-text">${this.escapeHtml(comment.comment)}</div>
            </div>
        `;
    }

    async addComment(photoId, buttonElement) {
        const username = document.getElementById('commentUsername').value.trim();
        const comment = document.getElementById('commentText').value.trim();
        
        if (!comment) {
            alert('Please enter a comment');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/comments/${photoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username || 'Anonymous',
                    comment: comment
                })
            });

            if (response.ok) {
                const newComment = await response.json();
                
                // Add comment to container
                const container = document.querySelector('.comments-container');
                const noComments = container.querySelector('.no-comments');
                if (noComments) {
                    noComments.remove();
                }
                
                container.insertAdjacentHTML('beforeend', this.createCommentHTML(newComment));
                
                // Clear form
                document.getElementById('commentUsername').value = '';
                document.getElementById('commentText').value = '';
                
                // Update comment count in stream
                this.updateCommentCount(photoId);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    }

    async updateCommentCount(photoId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/comments/${photoId}/count`);
            const result = await response.json();
            
            const commentBtn = document.querySelector(`[data-photo-id="${photoId}"] .comment-btn .comment-count`);
            if (commentBtn) {
                commentBtn.textContent = result.count;
            }
        } catch (error) {
            console.error('Error updating comment count:', error);
        }
    }

    async loadPhotoStats(photoId) {
        try {
            // Load like count and status
            const likeResponse = await fetch(`${this.apiBaseUrl}/likes/${photoId}`);
            const likeData = await likeResponse.json();
            
            const likeBtn = document.querySelector(`[data-photo-id="${photoId}"] .like-btn`);
            if (likeBtn) {
                const likeCount = likeBtn.querySelector('.like-count');
                likeCount.textContent = likeData.likeCount;
                
                if (likeData.userLiked) {
                    likeBtn.classList.add('liked');
                }
            }
            
            // Load comment count
            const commentResponse = await fetch(`${this.apiBaseUrl}/comments/${photoId}/count`);
            const commentData = await commentResponse.json();
            
            const commentBtn = document.querySelector(`[data-photo-id="${photoId}"] .comment-btn .comment-count`);
            if (commentBtn) {
                commentBtn.textContent = commentData.count;
            }
        } catch (error) {
            console.error('Error loading photo stats:', error);
        }
    }

    // Masonry Layout Helper
    initMasonryLayout() {
        const stream = document.getElementById('photoStream');
        if (!stream) return;

        // Wait for images to load before adjusting layout
        const images = stream.querySelectorAll('img');
        let loadedImages = 0;

        if (images.length === 0) return;

        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
                if (loadedImages === images.length) {
                    this.adjustMasonryLayout();
                }
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    if (loadedImages === images.length) {
                        this.adjustMasonryLayout();
                    }
                });
            }
        });
    }

    adjustMasonryLayout() {
        // Force browser to recalculate column layout
        const stream = document.getElementById('photoStream');
        if (stream) {
            stream.style.columnCount = '';
            setTimeout(() => {
                const width = stream.offsetWidth;
                if (width < 400) {
                    stream.style.columnCount = '1';
                } else if (width < 768) {
                    stream.style.columnCount = '2';
                } else if (width < 1200) {
                    stream.style.columnCount = '3';
                } else {
                    stream.style.columnCount = '4';
                }
            }, 100);
        }
    }

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
                this.updateUserInterface();
            } else {
                this.isAuthenticated = false;
                this.updateUserInterface();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isAuthenticated = false;
            this.updateUserInterface();
        }
    }

    updateUserInterface() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const welcomeUser = document.getElementById('welcomeUser');

        if (this.isAuthenticated && this.currentUser) {
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            welcomeUser.textContent = `Welcome, ${this.currentUser.displayName || this.currentUser.username}!`;
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    async handleSignUp(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            displayName: formData.get('displayName')
        };

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentUser = result.user;
                this.isAuthenticated = true;
                this.updateUserInterface();
                this.showToast('Account created successfully! Welcome to PhotoShare!', 'success');
                form.reset();
                
                // Scroll to gallery or redirect
                setTimeout(() => {
                    window.location.href = 'user-dashboard.html';
                }, 1500);
            } else {
                this.showToast(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentUser = result.user;
                this.isAuthenticated = true;
                this.updateUserInterface();
                this.closeLoginModal();
                this.showToast(`Welcome back, ${result.user.displayName || result.user.username}!`, 'success');
                form.reset();
                
                // Redirect to gallery
                setTimeout(() => {
                    window.location.href = 'user-dashboard.html';
                }, 1500);
            } else {
                this.showToast(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
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
                this.updateUserInterface();
                this.showToast('Logged out successfully', 'success');
            } else {
                this.showToast('Logout failed', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
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
            console.error('Server connection error:', error);
            return false;
        }
    }
}

// Initialize landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const landing = new PhotoShareLanding();
    
    // Check server status on load
    landing.checkServerStatus();
});