// Club Page JavaScript

class ClubPage {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.clubId = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.club = null;
        this.userMembership = null;
        this.currentSection = 'photos';
        this.photos = [];
        this.members = [];
        this.init();
    }

    async init() {
        // Get club ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.clubId = urlParams.get('id');
        
        if (!this.clubId) {
            this.showToast('Club ID not provided', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        // Check authentication
        await this.checkAuthStatus();
        
        // Load club data
        await this.loadClub();
        
        this.bindEvents();
        this.showSection('photos');
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
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isAuthenticated = false;
        }
    }

    updateUserInterface() {
        const welcomeUser = document.getElementById('welcomeUser');
        if (this.currentUser && welcomeUser) {
            welcomeUser.textContent = `Welcome, ${this.currentUser.displayName || this.currentUser.username}!`;
        }
    }

    // Event Bindings
    bindEvents() {
        // Club navigation
        document.querySelectorAll('.club-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Club actions
        document.getElementById('joinLeaveBtn')?.addEventListener('click', () => {
            this.toggleMembership();
        });

        document.getElementById('manageClubBtn')?.addEventListener('click', () => {
            this.showManagementModal();
        });

        document.getElementById('addPhotoBtn')?.addEventListener('click', () => {
            this.showAddPhotoModal();
        });

        // Modal events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        // Club management form
        document.getElementById('clubManagementForm')?.addEventListener('submit', (e) => {
            this.handleClubUpdate(e);
        });

        document.getElementById('deleteClubBtn')?.addEventListener('click', () => {
            this.handleClubDelete();
        });

        // Load more buttons
        document.getElementById('loadMorePhotos')?.addEventListener('click', () => {
            this.loadMorePhotos();
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    this.closeModal(modal);
                });
            }
        });
    }

    // Club Loading
    async loadClub() {
        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Club not found');
                } else if (response.status === 403) {
                    throw new Error('This club is private');
                } else {
                    throw new Error('Failed to load club');
                }
            }

            this.club = await response.json();
            this.userMembership = this.club.userMembership || { isMember: false };
            
            this.updateClubDisplay();
            
        } catch (error) {
            console.error('Error loading club:', error);
            this.showToast(error.message, 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
        } finally {
            this.showLoading(false);
        }
    }

    updateClubDisplay() {
        // Update club header
        document.getElementById('clubName').textContent = this.club.name;
        document.getElementById('clubDescription').textContent = this.club.description || 'No description provided.';
        document.getElementById('memberCount').textContent = this.club.memberCount || 0;
        document.getElementById('photoCount').textContent = this.club.photoCount || 0;
        document.getElementById('creatorName').textContent = this.club.creatorDisplayName || this.club.creatorUsername || 'Unknown';

        // Update about section
        document.getElementById('aboutDescription').textContent = this.club.description || 'No description provided.';
        document.getElementById('createdDate').textContent = new Date(this.club.createdAt).toLocaleDateString();
        document.getElementById('privacyStatus').textContent = this.club.isPrivate ? 'Private' : 'Public';
        document.getElementById('founderName').textContent = this.club.creatorDisplayName || this.club.creatorUsername || 'Unknown';

        // Update action buttons based on membership and permissions
        this.updateActionButtons();
    }

    updateActionButtons() {
        const joinLeaveBtn = document.getElementById('joinLeaveBtn');
        const manageClubBtn = document.getElementById('manageClubBtn');
        const addPhotoBtn = document.getElementById('addPhotoBtn');

        // Hide all buttons initially
        [joinLeaveBtn, manageClubBtn, addPhotoBtn].forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        if (!this.isAuthenticated) {
            return;
        }

        // Show appropriate buttons based on membership status
        if (this.userMembership.isMember) {
            // User is a member
            if (joinLeaveBtn) {
                joinLeaveBtn.textContent = 'Leave Club';
                joinLeaveBtn.className = 'btn-secondary';
                joinLeaveBtn.style.display = 'block';
            }

            if (addPhotoBtn) {
                addPhotoBtn.style.display = 'block';
            }

            // Show manage button for owners and admins
            if (this.userMembership.role === 'owner' || this.userMembership.role === 'admin') {
                if (manageClubBtn) {
                    manageClubBtn.style.display = 'block';
                }
            }
        } else {
            // User is not a member
            if (joinLeaveBtn) {
                joinLeaveBtn.textContent = 'Join Club';
                joinLeaveBtn.className = 'btn-primary';
                joinLeaveBtn.style.display = 'block';
            }
        }
    }

    // Section Navigation
    showSection(section) {
        // Update navigation
        document.querySelectorAll('.club-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Update content sections
        document.querySelectorAll('.club-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${section}Section`)?.classList.add('active');

        this.currentSection = section;

        // Load section-specific data
        switch (section) {
            case 'photos':
                this.loadClubPhotos();
                break;
            case 'members':
                this.loadClubMembers();
                break;
        }
    }

    // Load Club Data
    async loadClubPhotos() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}/photos`, {
                credentials: 'include'
            });

            if (response.ok) {
                this.photos = await response.json();
                this.displayPhotos();
            } else {
                this.showToast('Failed to load club photos', 'error');
            }
        } catch (error) {
            console.error('Error loading club photos:', error);
            this.showToast('Failed to load club photos', 'error');
        }
    }

    displayPhotos() {
        const container = document.getElementById('clubPhotos');
        if (!container) return;

        if (this.photos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No photos have been shared in this club yet.</p>
                    ${this.userMembership.isMember ? '<p>Be the first to share a photo!</p>' : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = this.photos.map(photo => `
            <div class="stream-photo" data-photo-id="${photo.id}">
                <img src="/uploads/${photo.thumbnailFilename}" alt="${this.escapeHtml(photo.title)}" loading="lazy">
                <div class="photo-overlay">
                    <div class="photo-info">
                        <h4>${this.escapeHtml(photo.title)}</h4>
                        <p>by ${this.escapeHtml(photo.postedByDisplayName || photo.postedByUsername)}</p>
                        <span class="photo-date">${new Date(photo.postedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click events to photos
        container.querySelectorAll('.stream-photo').forEach(photoEl => {
            photoEl.addEventListener('click', () => {
                const photoId = photoEl.dataset.photoId;
                const photo = this.photos.find(p => p.id === photoId);
                if (photo) {
                    this.showPhotoModal(photo);
                }
            });
        });
    }

    async loadClubMembers() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}/members`, {
                credentials: 'include'
            });

            if (response.ok) {
                this.members = await response.json();
                this.displayMembers();
            } else {
                this.showToast('Failed to load club members', 'error');
            }
        } catch (error) {
            console.error('Error loading club members:', error);
            this.showToast('Failed to load club members', 'error');
        }
    }

    displayMembers() {
        const container = document.getElementById('clubMembers');
        if (!container) return;

        container.innerHTML = this.members.map(member => `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-avatar">
                        ${member.profileImage ? 
                            `<img src="${member.profileImage}" alt="${this.escapeHtml(member.displayName || member.username)}">` :
                            (member.displayName || member.username).charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="member-details">
                        <h4>${this.escapeHtml(member.displayName || member.username)}</h4>
                        <p>@${this.escapeHtml(member.username)}</p>
                    </div>
                </div>
                <span class="member-role ${member.role}">${member.role}</span>
            </div>
        `).join('');
    }

    // Club Actions
    async toggleMembership() {
        if (!this.isAuthenticated) {
            this.showToast('Please log in to join clubs', 'error');
            return;
        }

        try {
            const action = this.userMembership.isMember ? 'leave' : 'join';
            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}/${action}`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(result.message, 'success');
                // Reload club data to update member count and buttons
                await this.loadClub();
            } else {
                this.showToast(result.error || `Failed to ${action} club`, 'error');
            }
        } catch (error) {
            console.error('Error toggling membership:', error);
            this.showToast('Failed to update membership', 'error');
        }
    }

    // Modal Management
    showManagementModal() {
        const modal = document.getElementById('clubManagementModal');
        const form = document.getElementById('clubManagementForm');
        
        // Populate form with current club data
        form.elements.name.value = this.club.name;
        form.elements.description.value = this.club.description || '';
        form.elements.isPrivate.checked = this.club.isPrivate;
        
        this.showModal(modal);
    }

    showAddPhotoModal() {
        const modal = document.getElementById('addPhotoModal');
        this.loadUserPhotos();
        this.showModal(modal);
    }

    async loadUserPhotos() {
        try {
            // Load user's photos (you'll need to implement this endpoint)
            const response = await fetch(`${this.apiBaseUrl}/photos/user/${this.currentUser.id}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const userPhotos = await response.json();
                this.displayUserPhotos(userPhotos);
            }
        } catch (error) {
            console.error('Error loading user photos:', error);
        }
    }

    displayUserPhotos(photos) {
        const container = document.getElementById('userPhotos');
        if (!container) return;

        container.innerHTML = photos.map(photo => `
            <div class="user-photo-item" data-photo-id="${photo.id}">
                <img src="/uploads/${photo.thumbnailFilename}" alt="${this.escapeHtml(photo.title)}">
            </div>
        `).join('');

        // Add click events
        container.querySelectorAll('.user-photo-item').forEach(item => {
            item.addEventListener('click', () => {
                // Select/deselect photo
                item.classList.toggle('selected');
                
                // Add to club if selected
                if (item.classList.contains('selected')) {
                    const photoId = item.dataset.photoId;
                    this.addPhotoToClub(photoId);
                }
            });
        });
    }

    async addPhotoToClub(photoId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ photoId })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeModal(document.getElementById('addPhotoModal'));
                // Reload photos if on photos section
                if (this.currentSection === 'photos') {
                    this.loadClubPhotos();
                }
                // Update photo count
                await this.loadClub();
            } else {
                this.showToast(result.error || 'Failed to add photo to club', 'error');
            }
        } catch (error) {
            console.error('Error adding photo to club:', error);
            this.showToast('Failed to add photo to club', 'error');
        }
    }

    showModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    showPhotoModal(photo) {
        const modal = document.getElementById('photoModal');
        document.getElementById('modalImage').src = `/uploads/${photo.filename}`;
        document.getElementById('modalTitle').textContent = photo.title;
        document.getElementById('modalDescription').textContent = photo.description || '';
        document.getElementById('modalAuthor').textContent = `by ${photo.postedByDisplayName || photo.postedByUsername}`;
        document.getElementById('modalDate').textContent = new Date(photo.postedAt).toLocaleDateString();
        
        this.showModal(modal);
    }

    // Club Management
    async handleClubUpdate(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const updateData = {
                name: formData.get('name'),
                description: formData.get('description'),
                isPrivate: formData.get('isPrivate') === 'on'
            };

            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeModal(document.getElementById('clubManagementModal'));
                await this.loadClub();
            } else {
                this.showToast(result.error || 'Failed to update club', 'error');
            }
        } catch (error) {
            console.error('Error updating club:', error);
            this.showToast('Failed to update club', 'error');
        }
    }

    async handleClubDelete() {
        if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/clubs/${this.clubId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'gallery.html', 2000);
            } else {
                this.showToast(result.error || 'Failed to delete club', 'error');
            }
        } catch (error) {
            console.error('Error deleting club:', error);
            this.showToast('Failed to delete club', 'error');
        }
    }

    // Utility Methods
    async handleLogout() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.success) {
                this.showToast('Logged out successfully', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.toggle('hidden', !show);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadMorePhotos() {
        // Implement pagination for photos
        console.log('Load more photos - to be implemented');
    }
}

// Initialize club page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClubPage();
});