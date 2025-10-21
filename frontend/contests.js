class ContestManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentUser = null;
        this.isAuthenticated = false;
        this.contests = [];
        this.currentSection = 'active';
        this.init();
    }

    async init() {
        // TEMP: Skip authentication for live server testing
        this.currentUser = {
            id: 1,
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com'
        };
        this.isAuthenticated = true;

        this.bindEvents();
        this.loadContests();
        this.showSection('active');
    }

    bindEvents() {
        // Contest tab navigation
        document.querySelectorAll('.contest-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.showSection(filter);
            });
        });

        // Contest entry form
        document.getElementById('contestEntryForm')?.addEventListener('submit', (e) => {
            this.handleContestEntry(e);
        });

        // Photo file input
        document.getElementById('entryPhoto')?.addEventListener('change', (e) => {
            this.handlePhotoPreview(e);
        });

        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        document.querySelector('.modal-overlay')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    showSection(sectionName) {
        // Update tabs
        document.querySelectorAll('.contest-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.contest-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionName + 'Contests');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentSection = sectionName;
        this.filterContests(sectionName);
    }

    async loadContests() {
        try {
            // TEMP: Use mock data for live server testing
            this.contests = [
                {
                    id: 1,
                    title: "Landscape Photography Challenge",
                    description: "Capture the beauty of natural landscapes in any season. Show us your best outdoor photography skills.",
                    status: "active",
                    startDate: "2025-10-01",
                    endDate: "2025-11-30",
                    entryFee: 0,
                    maxEntries: 3,
                    totalEntries: 45,
                    prizes: [
                        { position: "1st Place", reward: "$500 + Photography Equipment" },
                        { position: "2nd Place", reward: "$300 + Gift Card" },
                        { position: "3rd Place", reward: "$100 + Certificate" }
                    ],
                    clubId: null,
                    isPublic: true,
                    category: "Landscape"
                },
                {
                    id: 2,
                    title: "Portrait Masters",
                    description: "Show us your best portrait photography. Can be studio or environmental portraits.",
                    status: "upcoming",
                    startDate: "2025-12-01",
                    endDate: "2025-12-31",
                    entryFee: 15,
                    maxEntries: 2,
                    totalEntries: 0,
                    prizes: [
                        { position: "1st Place", reward: "$1000 + Studio Session" },
                        { position: "2nd Place", reward: "$500 + Equipment" },
                        { position: "3rd Place", reward: "$250 + Certificate" }
                    ],
                    clubId: null,
                    isPublic: true,
                    category: "Portrait"
                },
                {
                    id: 3,
                    title: "Street Photography",
                    description: "Capture life on the streets. Documentary style photography celebrating urban life.",
                    status: "ended",
                    startDate: "2025-08-01",
                    endDate: "2025-09-30",
                    entryFee: 10,
                    maxEntries: 5,
                    totalEntries: 78,
                    prizes: [
                        { position: "1st Place", reward: "$750 + Gallery Exhibition" },
                        { position: "2nd Place", reward: "$400 + Publication" },
                        { position: "3rd Place", reward: "$200 + Portfolio Review" }
                    ],
                    clubId: null,
                    isPublic: true,
                    category: "Street",
                    winner: {
                        userId: 5,
                        username: "streetphoto_master",
                        title: "Rush Hour Blues"
                    }
                },
                {
                    id: 4,
                    title: "Club Weekly Challenge",
                    description: "Members-only weekly challenge for the Street Photography Club.",
                    status: "active",
                    startDate: "2025-10-21",
                    endDate: "2025-10-28",
                    entryFee: 0,
                    maxEntries: 1,
                    totalEntries: 12,
                    prizes: [
                        { position: "Winner", reward: "Featured Photo + Recognition" }
                    ],
                    clubId: 2,
                    isPublic: false,
                    category: "Weekly",
                    clubName: "Street Photography Club"
                }
            ];

            this.filterContests(this.currentSection);
        } catch (error) {
            console.error('Error loading contests:', error);
            this.showToast('Failed to load contests', 'error');
        }
    }

    filterContests(filter) {
        let filteredContests = [];

        switch (filter) {
            case 'active':
                filteredContests = this.contests.filter(c => c.status === 'active' && c.isPublic);
                this.displayContests(filteredContests, 'activeContestsGrid');
                break;
            case 'upcoming':
                filteredContests = this.contests.filter(c => c.status === 'upcoming' && c.isPublic);
                this.displayContests(filteredContests, 'upcomingContestsGrid');
                break;
            case 'past':
                filteredContests = this.contests.filter(c => c.status === 'ended' && c.isPublic);
                this.displayContests(filteredContests, 'pastContestsGrid');
                break;
            case 'my-contests':
                // Show user's entries (mock data)
                filteredContests = [
                    {
                        id: 1,
                        title: "Landscape Photography Challenge",
                        status: "active",
                        myEntry: {
                            title: "Mountain Sunrise",
                            submittedDate: "2025-10-15",
                            status: "submitted"
                        }
                    }
                ];
                this.displayMyContests(filteredContests, 'myContestsGrid');
                break;
        }
    }

    displayContests(contests, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (contests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No contests found</h3>
                    <p>Check back later for new photography contests!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contests.map(contest => this.createContestCard(contest)).join('');
    }

    displayMyContests(contests, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (contests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No contest entries yet</h3>
                    <p>Enter a contest to start building your portfolio!</p>
                    <button class="btn-primary" onclick="contestManager.showSection('active')">Browse Active Contests</button>
                </div>
            `;
            return;
        }

        container.innerHTML = contests.map(contest => this.createMyContestCard(contest)).join('');
    }

    createContestCard(contest) {
        const endDate = new Date(contest.endDate).toLocaleDateString();
        const startDate = new Date(contest.startDate).toLocaleDateString();
        const daysLeft = Math.ceil((new Date(contest.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        const badgeClass = contest.status === 'active' ? 'active' : 
                          contest.status === 'upcoming' ? 'upcoming' : 'ended';
        
        const badgeText = contest.status === 'active' ? 'Active' :
                         contest.status === 'upcoming' ? 'Upcoming' : 'Ended';

        const actionButton = contest.status === 'active' ? 
            `<button class="btn-primary" onclick="contestManager.showEntryModal(${contest.id})">Enter Contest</button>` :
            contest.status === 'upcoming' ? 
            `<button class="btn-secondary" disabled>Opens ${startDate}</button>` :
            `<button class="btn-secondary" onclick="contestManager.showResults(${contest.id})">View Results</button>`;

        return `
            <div class="contest-card" data-contest-id="${contest.id}">
                <div class="contest-image">
                    <span class="contest-badge ${badgeClass}">${badgeText}</span>
                    📸
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
                            <p class="contest-meta-value">${contest.totalEntries}</p>
                        </div>
                    </div>

                    <div class="contest-details">
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Entry Fee</span>
                            <span class="contest-detail-value">${contest.entryFee === 0 ? 'Free' : '$' + contest.entryFee}</span>
                        </div>
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Max Entries</span>
                            <span class="contest-detail-value">${contest.maxEntries}</span>
                        </div>
                        ${contest.status === 'active' && daysLeft > 0 ? `
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Days Left</span>
                            <span class="contest-detail-value">${daysLeft} days</span>
                        </div>
                        ` : ''}
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
                        <button class="btn-secondary" onclick="contestManager.showContestDetails(${contest.id})">View Details</button>
                    </div>
                </div>
            </div>
        `;
    }

    createMyContestCard(contest) {
        const entry = contest.myEntry;
        const submittedDate = new Date(entry.submittedDate).toLocaleDateString();
        
        return `
            <div class="contest-card" data-contest-id="${contest.id}">
                <div class="contest-image">
                    📸
                </div>
                <div class="contest-info">
                    <h3 class="contest-title">${this.escapeHtml(contest.title)}</h3>
                    <p class="contest-description">Your entry: "${this.escapeHtml(entry.title)}"</p>
                    
                    <div class="contest-details">
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Submitted</span>
                            <span class="contest-detail-value">${submittedDate}</span>
                        </div>
                        <div class="contest-detail-row">
                            <span class="contest-detail-label">Status</span>
                            <span class="contest-detail-value">${entry.status}</span>
                        </div>
                    </div>

                    <div class="contest-actions">
                        <button class="btn-secondary" onclick="contestManager.showContestDetails(${contest.id})">View Contest</button>
                    </div>
                </div>
            </div>
        `;
    }

    showEntryModal(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return;

        const modal = document.getElementById('contestEntryModal');
        const detailsContainer = document.getElementById('contestDetails');
        
        detailsContainer.innerHTML = `
            <h3>${this.escapeHtml(contest.title)}</h3>
            <p>${this.escapeHtml(contest.description)}</p>
            <div class="contest-entry-info">
                <p><strong>Entry Fee:</strong> ${contest.entryFee === 0 ? 'Free' : '$' + contest.entryFee}</p>
                <p><strong>Max Entries:</strong> ${contest.maxEntries}</p>
                <p><strong>Deadline:</strong> ${new Date(contest.endDate).toLocaleDateString()}</p>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('contestEntryModal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset form
        document.getElementById('contestEntryForm').reset();
        document.getElementById('photoPreview').innerHTML = '';
    }

    handlePhotoPreview(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('photoPreview');
        
        if (!file) {
            preview.innerHTML = '';
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            e.target.value = '';
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Photo preview">
                <p>File: ${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    async handleContestEntry(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const title = formData.get('title');
        const description = formData.get('description');
        const photo = formData.get('photo');
        
        if (!photo || !title) {
            this.showToast('Please provide a title and select a photo', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showToast('Contest entry submitted successfully!', 'success');
            this.closeModal();
            
        } catch (error) {
            console.error('Contest entry error:', error);
            this.showToast('Failed to submit contest entry', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showContestDetails(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return;
        
        // Could open a detailed modal or navigate to a detail page
        this.showToast('Contest details would be shown here', 'info');
    }

    showResults(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return;
        
        if (contest.winner) {
            this.showToast(`Winner: ${contest.winner.title} by @${contest.winner.username}`, 'success');
        } else {
            this.showToast('Results not yet available', 'info');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.toggle('hidden', !show);
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize contest manager when page loads
const contestManager = new ContestManager();