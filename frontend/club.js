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
        
        // TEMP: Set dummy user for live server testing
        this.currentUser = {
            id: 1,
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com'
        };
        this.isAuthenticated = true;
        
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

    // TEMP: Mock loadClub method for live server testing
    async loadClub() {
        // Mock club data
        this.club = {
            id: this.clubId,
            name: "Sample Photography Club",
            description: "A demo club for testing the interface",
            memberCount: 15,
            photoCount: 30,
            isPrivate: false,
            creatorUsername: "testuser",
            role: "owner"
        };
        
        this.updateClubDisplay();
        this.loadClubPhotos();
        this.loadClubMembers();
    }

    updateClubDisplay() {
        // Update club header with mock data
        const clubName = document.querySelector('.club-name');
        const clubDescription = document.querySelector('.club-description');
        const memberCount = document.querySelector('.member-count');
        const photoCount = document.querySelector('.photo-count');
        
        if (clubName) clubName.textContent = this.club.name;
        if (clubDescription) clubDescription.textContent = this.club.description;
        if (memberCount) memberCount.textContent = `${this.club.memberCount} members`;
        if (photoCount) photoCount.textContent = `${this.club.photoCount} photos`;
    }

    loadClubPhotos() {
        // Mock photos data
        const mockPhotos = [
            {
                id: 1,
                title: "Club Photo 1",
                description: "Sample club photo",
                uploadDate: new Date().toISOString()
            },
            {
                id: 2,
                title: "Club Photo 2", 
                description: "Another sample photo",
                uploadDate: new Date().toISOString()
            }
        ];
        
        const photosContainer = document.querySelector('.club-photos-grid');
        if (photosContainer) {
            photosContainer.innerHTML = mockPhotos.map(photo => this.createPhotoCard(photo)).join('');
        }
    }

    loadClubMembers() {
        // Mock members data
        const mockMembers = [
            {
                id: 1,
                username: "testuser",
                displayName: "Test User",
                role: "owner"
            },
            {
                id: 2,
                username: "member1",
                displayName: "Member One",
                role: "member"
            }
        ];
        
        const membersContainer = document.querySelector('.club-members-grid');
        if (membersContainer) {
            membersContainer.innerHTML = mockMembers.map(member => this.createMemberCard(member)).join('');
        }
    }

    createPhotoCard(photo) {
        const uploadDate = new Date(photo.uploadDate).toLocaleDateString();
        return `
            <div class="photo-card" data-photo-id="${photo.id}">
                <div style="width: 100%; height: 200px; background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">📸</div>
                <div class="photo-info">
                    <h4>${photo.title}</h4>
                    <p>${photo.description}</p>
                    <span class="photo-date">${uploadDate}</span>
                </div>
            </div>
        `;
    }

    createMemberCard(member) {
        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-avatar">👤</div>
                <div class="member-info">
                    <h4>${member.displayName}</h4>
                    <p>@${member.username}</p>
                    <span class="member-role">${member.role}</span>
                </div>
            </div>
        `;
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
            
            // TEMP: Use mock data for live server testing
            this.club = {
                id: this.clubId || 1,
                name: "Street Photography Club",
                description: "A community for photographers passionate about capturing life on the streets. We share techniques, organize photo walks, and celebrate the art of candid urban photography.",
                isPrivate: false,
                memberCount: 28,
                photoCount: 156,
                creatorDisplayName: "Alex Johnson",
                creatorUsername: "alexj_photo",
                createdAt: "2024-08-15T10:30:00Z",
                userMembership: {
                    isMember: true,
                    role: "member",
                    status: "approved"
                }
            };
            
            this.userMembership = this.club.userMembership || { isMember: false };
            
            this.updateClubDisplay();
            
            // Load mock photos
            this.loadMockPhotos();
            
        } catch (error) {
            console.error('Error loading club:', error);
            this.showToast(error.message, 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
        } finally {
            this.showLoading(false);
        }
    }

    loadMockPhotos() {
        // Call the existing photo loading method
        this.loadClubPhotos();
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
            case 'contests':
                this.loadClubContests();
                break;
        }
    }

    // Load Club Data
    async loadClubPhotos() {
        try {
            // TEMP: Use mock data for live server testing
            this.photos = [
                {
                    id: "1",
                    title: "Street Art Downtown",
                    description: "Amazing murals in the city center",
                    filename: "street-art-1.jpg",
                    thumbnailFilename: "thumb-street-art-1.jpg",
                    uploadDate: "2024-10-15T14:30:00Z",
                    uploader: {
                        username: "alexj_photo",
                        displayName: "Alex Johnson"
                    },
                    tags: ["street", "art", "mural", "urban"],
                    likes: 23
                },
                {
                    id: "2", 
                    title: "Morning Rush",
                    description: "Capturing the energy of morning commuters",
                    filename: "morning-rush-2.jpg",
                    thumbnailFilename: "thumb-morning-rush-2.jpg",
                    uploadDate: "2024-10-12T08:15:00Z",
                    uploader: {
                        username: "sarah_lens",
                        displayName: "Sarah Chen"
                    },
                    tags: ["street", "people", "morning", "commute"],
                    likes: 31
                },
                {
                    id: "3",
                    title: "Shadows and Light",
                    description: "Playing with natural light and urban shadows",
                    filename: "shadows-light-3.jpg", 
                    thumbnailFilename: "thumb-shadows-light-3.jpg",
                    uploadDate: "2024-10-10T16:45:00Z",
                    uploader: {
                        username: "mike_street",
                        displayName: "Mike Rodriguez"
                    },
                    tags: ["shadows", "light", "architecture", "street"],
                    likes: 18
                }
            ];
            this.displayPhotos();
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
            // TEMP: Use mock data for live server testing
            this.members = [
                {
                    id: 1,
                    username: "alexj_photo",
                    displayName: "Alex Johnson", 
                    role: "owner",
                    joinedAt: "2024-08-15T10:30:00Z",
                    status: "approved",
                    avatar: null
                },
                {
                    id: 2,
                    username: "sarah_lens",
                    displayName: "Sarah Chen",
                    role: "admin", 
                    joinedAt: "2024-08-20T14:15:00Z",
                    status: "approved",
                    avatar: null
                },
                {
                    id: 3,
                    username: "mike_street",
                    displayName: "Mike Rodriguez",
                    role: "member",
                    joinedAt: "2024-09-02T09:45:00Z", 
                    status: "approved",
                    avatar: null
                },
                {
                    id: 4,
                    username: "testuser",
                    displayName: "Test User",
                    role: "member",
                    joinedAt: "2024-10-01T12:00:00Z",
                    status: "approved", 
                    avatar: null
                }
            ];
            this.displayMembers();
        } catch (error) {
            console.error('Error loading club members:', error);
            this.showToast('Failed to load club members', 'error');
        }
    }

    async loadClubContests() {
        try {
            // TEMP: Use mock data for live server testing
            const mockContests = [
                {
                    id: 1,
                    title: "Weekly Street Challenge",
                    description: "Capture the essence of street life in one powerful image. Show us your unique perspective on urban photography.",
                    status: "active",
                    start_date: "2024-10-21",
                    end_date: "2024-10-28", 
                    entry_fee: 0,
                    max_entries: 1,
                    total_entries: 8,
                    prizes: [
                        { position: "Winner", reward: "Featured Photo + Recognition" }
                    ],
                    club_id: this.clubId,
                    is_public: false,
                    category: "Weekly",
                    club_name: this.club.name
                },
                {
                    id: 2,
                    title: "Best Portrait of the Month",
                    description: "Show us your best portrait work. Can include environmental portraits, studio work, or candid captures.",
                    status: "upcoming",
                    start_date: "2024-11-01",
                    end_date: "2024-11-30",
                    entry_fee: 5,
                    max_entries: 3,
                    total_entries: 0,
                    prizes: [
                        { position: "1st Place", reward: "$100 + Certificate" },
                        { position: "2nd Place", reward: "$50 + Recognition" },
                        { position: "3rd Place", reward: "Certificate" }
                    ],
                    club_id: this.clubId,
                    is_public: true,
                    category: "Portrait",
                    club_name: this.club.name
                }
            ];

            this.displayClubContests(mockContests);
        } catch (error) {
            console.error('Error loading club contests:', error);
            this.showToast('Failed to load club contests', 'error');
        }
    }

    displayClubContests(contests) {
        const container = document.getElementById('clubContestsGrid');
        if (!container) return;

        if (contests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No contests yet</h3>
                    <p>This club hasn't created any contests yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contests.map(contest => this.createContestCard(contest)).join('');
    }

    createContestCard(contest) {
        const endDate = new Date(contest.end_date).toLocaleDateString();
        const daysLeft = Math.ceil((new Date(contest.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        const badgeClass = contest.status === 'active' ? 'active' : 
                          contest.status === 'upcoming' ? 'upcoming' : 'ended';
        
        const badgeText = contest.status === 'active' ? 'Active' :
                         contest.status === 'upcoming' ? 'Upcoming' : 'Ended';

        const actionButton = contest.status === 'active' ? 
            `<button class="btn-primary" onclick="this.showContestEntry(${contest.id})">Enter Contest</button>` :
            contest.status === 'upcoming' ? 
            `<button class="btn-secondary" disabled>Opens Soon</button>` :
            `<button class="btn-secondary">View Results</button>`;

        return `
            <div class="contest-card" data-contest-id="${contest.id}">
                <div class="contest-image">
                    <span class="contest-badge ${badgeClass}">${badgeText}</span>
                    🏆
                </div>
                <div class="contest-info">
                    <h3 class="contest-title">${this.escapeHtml(contest.title)}</h3>
                    <p class="contest-description">${this.escapeHtml(contest.description)}</p>
                    
                    <div class="contest-meta">
                        <div class="contest-meta-item">
                            <p class="contest-meta-label">End Date</p>
                            <p class="contest-meta-value">${endDate}</p>
                        </div>
                        <div class="contest-meta-item">
                            <p class="contest-meta-label">Entries</p>
                            <p class="contest-meta-value">${contest.total_entries}</p>
                        </div>
                    </div>

                    <div class="contest-details">
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Entry Fee</span>
                            <span class="contest-detail-value">${contest.entry_fee === 0 ? 'Free' : '$' + contest.entry_fee}</span>
                        </div>
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Max Entries</span>
                            <span class="contest-detail-value">${contest.max_entries}</span>
                        </div>
                        ${contest.status === 'active' && daysLeft > 0 ? `
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Days Left</span>
                            <span class="contest-detail-value">${daysLeft} days</span>
                        </div>
                        ` : ''}
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Visibility</span>
                            <span class="contest-detail-value">${contest.is_public ? 'Public' : 'Members Only'}</span>
                        </div>
                    </div>

                    <div class="contest-prizes">
                        <h4>Prizes</h4>
                        <ul class="prize-list">
                            ${contest.prizes.map(prize => `
                                <li class="prize-item">
                                    <span class="prize-position">${prize.position}</span>
                                    <span class="prize-reward">${prize.reward}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="contest-actions">
                        ${actionButton}
                    </div>
                </div>
            </div>
        `;
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize club page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClubPage();
});