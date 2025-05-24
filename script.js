// Session management
const sessionKey = 'adminAuthenticated';

// Check authentication status
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem(sessionKey) === 'true';

    // If on login page and already authenticated, redirect to dashboard
    if (window.location.pathname.endsWith('index.html') && isAuthenticated) {
        window.location.href = 'dashboard.html';
        return;
    }

    // If not on login page and not authenticated, redirect to login
    if (!window.location.pathname.endsWith('index.html') && !isAuthenticated) {
        window.location.href = 'index.html';
        return;
    }

    // If on logout page, perform logout
    if (window.location.pathname.endsWith('logout.html')) {
        logout();
    }
}

// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple validation (in production, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
        sessionStorage.setItem(sessionKey, 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials. Try admin/admin123 for demo.');
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem(sessionKey);
    window.location.href = 'index.html';
}

// Initialize on page load
window.onload = function () {
    checkAuth();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            login();
        });
    }

    if (performance.navigation.type === 2 && !sessionStorage.getItem(sessionKey)) {
        window.location.href = 'index.html';
    }
};

// Disable caching for sensitive pages
window.onpageshow = function (event) {
    if (event.persisted && !sessionStorage.getItem(sessionKey) && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
};

// Owner Data Management
const API_BASE_URL = 'https://apiabhiproject.lytortech.com/api/v1';
let currentOwners = [];
let currentVerifiedStatus = true;
let currentOwnerId = null;

// DOM Elements
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const toggleButtons = document.querySelectorAll('.toggle-btn');
const viewModal = document.getElementById('viewModal');
const verifyModal = document.getElementById('verifyModal');
const deleteModal = document.getElementById('deleteModal');
const viewModalBody = document.getElementById('viewModalBody');

// Fetch owners data from API
async function fetchOwners(isVerified) {
    try {
        console.log(`Fetching owners with isVerified=${isVerified}`);
        tableBody.innerHTML = '<tr><td colspan="5" class="loading-spinner"><div class="spinner"></div></td></tr>';

        const apiUrl = `${API_BASE_URL}/verified/data/${isVerified}`;
        console.log("Fetching from:", apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Access-Control-Allow-Origin': '*'
            }
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error response:", errorData);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorData}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);
        
        currentOwners = data;
        renderOwners(currentOwners);
    } catch (error) {
        console.error('Error fetching owners:', error);
        let errorMessage = 'Failed to load data. Please try again.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Check console for details.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS Error: Ensure backend has proper CORS headers';
        }
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--danger-color); padding: 20px;">
                    ${errorMessage}
                    <br><small>${error.message}</small>
                </td>
            </tr>
        `;
    }
}


// Render owners to table
function renderOwners(owners) {
    if (owners.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #777;">No owners found</td></tr>';
        return;
    }

    tableBody.innerHTML = owners.map(owner => `
        <tr>
            <td>${owner.name}</td>
            <td>${owner.type}</td>
            <td>${owner.address}</td>
            <td>₹${owner.rentAmount.toLocaleString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn view" data-id="${owner.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${owner.isVerified ? '' : `
                    <button class="btn verify" data-id="${owner.id}">
                        <i class="fas fa-check-circle"></i> Verify
                    </button>
                    `}
                    <button class="btn delete" data-id="${owner.id}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Show owner details in modal
function showOwnerDetails(ownerId) {
    const owner = currentOwners.find(o => o.id === ownerId);
    if (!owner) return;

    viewModalBody.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Property Name:</div>
            <div class="detail-value">${owner.name}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Property Type:</div>
            <div class="detail-value">${owner.type}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Address:</div>
            <div class="detail-value">${owner.address}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Rent Amount:</div>
            <div class="detail-value">₹${owner.rentAmount.toLocaleString()}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Deposit Amount:</div>
            <div class="detail-value">₹${owner.depositAmount.toLocaleString()}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Owner Name:</div>
            <div class="detail-value">${owner.ownerName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Contact Number:</div>
            <div class="detail-value">${owner.contactNumber}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Alternate Contact:</div>
            <div class="detail-value">${owner.alternateContact || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${owner.email}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Verification Status:</div>
            <div class="detail-value">
                <span class="status-badge ${owner.isVerified ? 'verified' : 'unverified'}">
                    ${owner.isVerified ? 'Verified' : 'Unverified'}
                </span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Amenities:</div>
            <div class="detail-value">
                ${owner.hasWifi ? '<span class="amenity"><i class="fas fa-wifi"></i> WiFi</span>' : ''}
                ${owner.hasAC ? '<span class="amenity"><i class="fas fa-snowflake"></i> AC</span>' : ''}
                ${owner.hasFood ? '<span class="amenity"><i class="fas fa-utensils"></i> Food</span>' : ''}
                ${owner.hasLaundry ? '<span class="amenity"><i class="fas fa-tshirt"></i> Laundry</span>' : ''}
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Rooms:</div>
            <div class="detail-value">${owner.availableRooms} available / ${owner.totalRooms} total</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Created At:</div>
            <div class="detail-value">${new Date(owner.createdAt).toLocaleString()}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Last Updated:</div>
            <div class="detail-value">${new Date(owner.updatedAt).toLocaleString()}</div>
        </div>
    `;

    viewModal.style.display = 'flex';
}

// Verify owner
async function verifyOwner(ownerId, verifyStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/data/${ownerId}/verification`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isVerified: verifyStatus })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('Owner verification status updated successfully!');
        fetchOwners(currentVerifiedStatus);
    } catch (error) {
        console.error('Error verifying owner:', error);
        alert('Failed to update verification status. Please try again.');
    }
}

// Delete owner
async function deleteOwner(ownerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/ownerdata/delete/${ownerId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('Owner deleted successfully!');
        fetchOwners(currentVerifiedStatus);
    } catch (error) {
        console.error('Error deleting owner:', error);
        alert('Failed to delete owner. Please try again.');
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Load initial data
    fetchOwners(currentVerifiedStatus);

    // Toggle verified/unverified
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentVerifiedStatus = btn.dataset.verified === 'true';
            fetchOwners(currentVerifiedStatus);
        });
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm === '') {
            renderOwners(currentOwners);
            return;
        }

        const filtered = currentOwners.filter(owner =>
            owner.name.toLowerCase().includes(searchTerm) ||
            owner.type.toLowerCase().includes(searchTerm) ||
            owner.address.toLowerCase().includes(searchTerm) ||
            owner.ownerName.toLowerCase().includes(searchTerm) ||
            owner.contactNumber.includes(searchTerm)
        );

        renderOwners(filtered);
    });

    // Table action buttons (using event delegation)
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.btn');
        if (!target) return;

        const ownerId = parseInt(target.dataset.id);
        currentOwnerId = ownerId;

        if (target.classList.contains('view')) {
            showOwnerDetails(ownerId);
        } else if (target.classList.contains('verify')) {
            verifyModal.style.display = 'flex';
        } else if (target.classList.contains('delete')) {
            deleteModal.style.display = 'flex';
        }
    });

    // Modal close buttons
    document.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            viewModal.style.display = 'none';
            verifyModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });

    // Verify confirmation
    document.querySelector('.confirm-verify').addEventListener('click', () => {
        verifyModal.style.display = 'none';
        verifyOwner(currentOwnerId, true);
    });

    document.querySelector('.cancel-verify').addEventListener('click', () => {
        verifyModal.style.display = 'none';
    });

    // Delete confirmation
    document.querySelector('.confirm-delete').addEventListener('click', () => {
        deleteModal.style.display = 'none';
        deleteOwner(currentOwnerId);
    });

    document.querySelector('.cancel-delete').addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) viewModal.style.display = 'none';
        if (e.target === verifyModal) verifyModal.style.display = 'none';
        if (e.target === deleteModal) deleteModal.style.display = 'none';
    });
});