// Events Page JavaScript

// Mock data for events
const mockEvents = [
    {
        id: 1,
        title: "Urban Street Photography Workshop",
        description: "Learn the art of capturing life in the city. We'll explore composition, lighting, and storytelling through street photography.",
        type: "workshop",
        level: "intermediate",
        date: "2024-11-15",
        time: "14:00",
        locationType: "outdoor",
        locationDetails: "Downtown City Center - Meet at Central Square",
        price: 45.00,
        capacity: 15,
        currentParticipants: 8,
        organizerType: "club",
        organizer: "Urban Photography Club",
        tags: ["street", "urban", "composition", "lighting"],
        created: "2024-10-20"
    },
    {
        id: 2,
        title: "Portrait Lighting Masterclass",
        description: "Master the fundamentals of portrait lighting with professional setups. Learn about key light, fill light, and background lighting techniques.",
        type: "lecture",
        level: "advanced",
        date: "2024-11-18",
        time: "18:30",
        locationType: "studio",
        locationDetails: "PhotoStudio Pro - 123 Main Street",
        price: 75.00,
        capacity: 12,
        currentParticipants: 10,
        organizerType: "individual",
        organizer: "Sarah Johnson",
        tags: ["portrait", "lighting", "studio", "professional"],
        created: "2024-10-18"
    },
    {
        id: 3,
        title: "Nature Photography Meetup",
        description: "Join fellow nature enthusiasts for a relaxed morning of wildlife and landscape photography. All skill levels welcome!",
        type: "meetup",
        level: "all-levels",
        date: "2024-11-22",
        time: "08:00",
        locationType: "outdoor",
        locationDetails: "Riverside Park - North Entrance",
        price: 0,
        capacity: 25,
        currentParticipants: 18,
        organizerType: "club",
        organizer: "Nature Photography Society",
        tags: ["nature", "wildlife", "landscape", "outdoor"],
        created: "2024-10-19"
    },
    {
        id: 4,
        title: "Digital Photo Editing Basics",
        description: "Introduction to photo editing software and basic enhancement techniques. Perfect for beginners looking to improve their digital workflow.",
        type: "workshop",
        level: "beginner",
        date: "2024-11-25",
        time: "10:00",
        locationType: "online",
        locationDetails: "Zoom Meeting (link will be provided)",
        price: 25.00,
        capacity: 30,
        currentParticipants: 22,
        organizerType: "individual",
        organizer: "Mike Chen",
        tags: ["editing", "digital", "software", "beginner"],
        created: "2024-10-21"
    },
    {
        id: 5,
        title: "Wedding Photography Business",
        description: "Learn how to start and grow your wedding photography business. Covering pricing, client management, and marketing strategies.",
        type: "lecture",
        level: "intermediate",
        date: "2024-12-02",
        time: "19:00",
        locationType: "indoor",
        locationDetails: "Community Center - Conference Room A",
        price: 55.00,
        capacity: 20,
        currentParticipants: 14,
        organizerType: "club",
        organizer: "Professional Photographers Alliance",
        tags: ["wedding", "business", "marketing", "professional"],
        created: "2024-10-20"
    },
    {
        id: 6,
        title: "Photography Social & Networking",
        description: "Casual evening to meet other photographers, share work, and build connections in the photography community. Light refreshments provided.",
        type: "social",
        level: "all-levels",
        date: "2024-11-28",
        time: "18:00",
        locationType: "indoor",
        locationDetails: "The Creative Space - 456 Art Street",
        price: 0,
        capacity: 50,
        currentParticipants: 32,
        organizerType: "club",
        organizer: "Photography Community Network",
        tags: ["networking", "social", "community", "casual"],
        created: "2024-10-17"
    }
];

// Global variables
let currentTab = 'all';
let filteredEvents = [...mockEvents];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    setupEventListeners();
});

function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const createModal = document.getElementById('createEventModal');
        const detailsModal = document.getElementById('eventDetailsModal');
        
        if (event.target === createModal) {
            closeCreateEventModal();
        }
        if (event.target === detailsModal) {
            closeEventDetailsModal();
        }
    });
}

// Tab switching functionality
function switchTab(tab) {
    currentTab = tab;
    
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tabEl => {
        tabEl.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Filter and reload events
    filterEvents();
}

// Event filtering
function filterEvents() {
    const searchTerm = document.getElementById('eventSearch').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;
    
    filteredEvents = mockEvents.filter(event => {
        // Tab filter
        if (currentTab !== 'all') {
            if (currentTab === 'club' && event.organizerType !== 'club') return false;
            if (currentTab === 'community' && event.organizerType !== 'individual') return false;
            if (currentTab === 'workshops' && event.type !== 'workshop') return false;
            if (currentTab === 'meetups' && event.type !== 'meetup') return false;
        }
        
        // Search filter
        if (searchTerm && !event.title.toLowerCase().includes(searchTerm) && 
            !event.description.toLowerCase().includes(searchTerm) &&
            !event.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
            return false;
        }
        
        // Location filter
        if (locationFilter && event.locationType !== locationFilter) return false;
        
        // Level filter
        if (levelFilter && event.level !== levelFilter) return false;
        
        // Date filter
        if (dateFilter) {
            const eventDate = new Date(event.date);
            const today = new Date();
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            switch(dateFilter) {
                case 'today':
                    if (eventDate.toDateString() !== today.toDateString()) return false;
                    break;
                case 'week':
                    if (eventDate < today || eventDate > weekFromNow) return false;
                    break;
                case 'month':
                    if (eventDate < today || eventDate > monthFromNow) return false;
                    break;
                case 'upcoming':
                    if (eventDate < today) return false;
                    break;
            }
        }
        
        return true;
    });
    
    loadEvents();
}

// Load and display events
function loadEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const noEventsMessage = document.getElementById('noEventsMessage');
    
    if (filteredEvents.length === 0) {
        eventsGrid.innerHTML = '';
        noEventsMessage.style.display = 'block';
        return;
    }
    
    noEventsMessage.style.display = 'none';
    
    eventsGrid.innerHTML = filteredEvents.map(event => createEventCard(event)).join('');
}

// Create event card HTML
function createEventCard(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const formattedTime = new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    const priceDisplay = event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`;
    const priceClass = event.price === 0 ? 'free' : '';
    
    const capacityDisplay = event.capacity ? 
        `${event.currentParticipants}/${event.capacity}` : 
        `${event.currentParticipants}`;
    
    const typeEmojis = {
        workshop: '🎓',
        meetup: '🤝',
        photowalk: '🚶',
        exhibition: '🖼️',
        competition: '🏆',
        lecture: '📚',
        social: '🎉'
    };
    
    const locationEmojis = {
        online: '🌐',
        indoor: '🏠',
        outdoor: '🌳',
        studio: '📸'
    };
    
    return `
        <div class="event-card" onclick="showEventDetails(${event.id})">
            <div class="event-card-header">
                <div class="event-meta">
                    <span class="event-type">${typeEmojis[event.type] || '📅'} ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                    <span class="event-level">${getLevelEmoji(event.level)} ${event.level.charAt(0).toUpperCase() + event.level.slice(1).replace('-', ' ')}</span>
                    <span class="event-price ${priceClass}">💰 ${priceDisplay}</span>
                </div>
                
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description}</p>
                
                <div class="event-details">
                    <div class="event-detail">
                        <span>📅</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="event-detail">
                        <span>🕐</span>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="event-detail">
                        <span>${locationEmojis[event.locationType]}</span>
                        <span>${event.locationDetails}</span>
                    </div>
                </div>
                
                ${event.tags.length > 0 ? `
                    <div class="event-tags">
                        ${event.tags.map(tag => `<span class="event-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="event-card-footer">
                <div class="event-organizer">
                    <span>${event.organizerType === 'club' ? '🏛️' : '👤'}</span>
                    <span>${event.organizer}</span>
                </div>
                <div class="event-participants">
                    <span>👥</span>
                    <span>${capacityDisplay}</span>
                </div>
            </div>
        </div>
    `;
}

function getLevelEmoji(level) {
    const emojis = {
        beginner: '🌱',
        intermediate: '📈',
        advanced: '🚀',
        'all-levels': '🎊'
    };
    return emojis[level] || '📊';
}

// Event details modal
function showEventDetails(eventId) {
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventDetailsModal');
    const title = document.getElementById('eventDetailsTitle');
    const body = document.getElementById('eventDetailsBody');
    
    title.textContent = event.title;
    body.innerHTML = createEventDetailsHTML(event);
    
    modal.style.display = 'block';
}

function createEventDetailsHTML(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const formattedTime = new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    const priceDisplay = event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`;
    const capacityDisplay = event.capacity ? 
        `${event.currentParticipants} / ${event.capacity} participants` : 
        `${event.currentParticipants} participants`;
    
    return `
        <div class="event-details-content">
            <div class="event-details-section">
                <h3>📋 Event Information</h3>
                <div class="event-details-grid">
                    <div class="event-detail-item">
                        <span>📅</span>
                        <span><strong>Date:</strong> ${formattedDate}</span>
                    </div>
                    <div class="event-detail-item">
                        <span>🕐</span>
                        <span><strong>Time:</strong> ${formattedTime}</span>
                    </div>
                    <div class="event-detail-item">
                        <span>📍</span>
                        <span><strong>Location:</strong> ${event.locationDetails}</span>
                    </div>
                    <div class="event-detail-item">
                        <span>💰</span>
                        <span><strong>Price:</strong> ${priceDisplay}</span>
                    </div>
                    <div class="event-detail-item">
                        <span>🎯</span>
                        <span><strong>Level:</strong> ${event.level.charAt(0).toUpperCase() + event.level.slice(1).replace('-', ' ')}</span>
                    </div>
                    <div class="event-detail-item">
                        <span>👥</span>
                        <span><strong>Participants:</strong> ${capacityDisplay}</span>
                    </div>
                </div>
            </div>
            
            <div class="event-details-section">
                <h3>📝 Description</h3>
                <p>${event.description}</p>
            </div>
            
            <div class="event-details-section">
                <h3>👤 Organizer</h3>
                <div class="event-detail-item">
                    <span>${event.organizerType === 'club' ? '🏛️' : '👤'}</span>
                    <span><strong>${event.organizer}</strong> (${event.organizerType === 'club' ? 'Photography Club' : 'Individual Organizer'})</span>
                </div>
            </div>
            
            ${event.tags.length > 0 ? `
                <div class="event-details-section">
                    <h3>🏷️ Tags</h3>
                    <div class="event-tags">
                        ${event.tags.map(tag => `<span class="event-tag">#${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="form-actions">
                <button class="btn-secondary" onclick="closeEventDetailsModal()">Close</button>
                <button class="btn-primary" onclick="joinEvent(${event.id})">Join Event</button>
            </div>
        </div>
    `;
}

function closeEventDetailsModal() {
    document.getElementById('eventDetailsModal').style.display = 'none';
}

// Join event functionality
function joinEvent(eventId) {
    // This would typically send a request to the backend
    alert('Thank you for joining! You will receive confirmation details shortly.');
    closeEventDetailsModal();
}

// Create event modal
function showCreateEventModal() {
    document.getElementById('createEventModal').style.display = 'block';
}

function closeCreateEventModal() {
    document.getElementById('createEventModal').style.display = 'none';
    document.getElementById('createEventForm').reset();
    document.getElementById('locationDetailsGroup').style.display = 'none';
}

function toggleLocationDetails() {
    const locationType = document.getElementById('eventLocation').value;
    const detailsGroup = document.getElementById('locationDetailsGroup');
    
    if (locationType) {
        detailsGroup.style.display = 'block';
        
        // Update placeholder based on location type
        const detailsInput = document.getElementById('eventLocationDetails');
        switch(locationType) {
            case 'online':
                detailsInput.placeholder = 'Enter meeting link (Zoom, Teams, etc.)';
                break;
            case 'indoor':
                detailsInput.placeholder = 'Enter venue address';
                break;
            case 'outdoor':
                detailsInput.placeholder = 'Enter meeting location';
                break;
            case 'studio':
                detailsInput.placeholder = 'Enter studio address';
                break;
        }
    } else {
        detailsGroup.style.display = 'none';
    }
}

// Handle event creation
function handleCreateEvent(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const eventData = {
        title: formData.get('title'),
        type: formData.get('type'),
        level: formData.get('level'),
        description: formData.get('description'),
        date: formData.get('date'),
        time: formData.get('time'),
        locationType: formData.get('locationType'),
        locationDetails: formData.get('locationDetails'),
        capacity: formData.get('capacity') ? parseInt(formData.get('capacity')) : null,
        price: formData.get('price') ? parseFloat(formData.get('price')) : 0,
        organizerType: formData.get('organizerType'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
    };
    
    // Validation
    if (!eventData.title || !eventData.type || !eventData.level || !eventData.description || 
        !eventData.date || !eventData.time || !eventData.locationType || !eventData.organizerType) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Check if event date is in the future
    const eventDate = new Date(eventData.date);
    const today = new Date();
    if (eventDate < today) {
        alert('Event date must be in the future.');
        return;
    }
    
    // This would typically send the data to the backend
    console.log('Creating event:', eventData);
    alert('Event created successfully! It will be reviewed and published shortly.');
    
    closeCreateEventModal();
}

// Show my events (placeholder)
function showMyEvents() {
    alert('My Events feature coming soon! You will be able to view and manage your created and joined events here.');
}

// Set minimum date for event creation to today
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        eventDateInput.min = today;
    }
});