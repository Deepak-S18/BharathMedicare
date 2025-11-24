let allUsers = [];
let pendingDoctors = [];
let auditLogs = [];
let stats = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const user = getUserData();

    if (user.role !== 'admin') {
        showError('Access denied. This page is for admins only.');
        setTimeout(() => {
            redirectToDashboard(user.role);
        }, 2000);
        return;
    }

    await loadDashboardData();
});

// Load all dashboard data
async function loadDashboardData() {
    showLoading();

    try {
        await Promise.all([
            loadStats(),
            loadPendingDoctors(),
            loadUsers(),
            loadAuditLogs()
        ]);
    } catch (error) {
        showError('Failed to load dashboard data');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await apiCall(API_ENDPOINTS.ADMIN_STATS);
        stats = response;

        // Update stats display
        document.getElementById('totalUsers').textContent = stats.users.total;
        document.getElementById('totalPatients').textContent = stats.users.patients;
        document.getElementById('totalDoctors').textContent = stats.users.doctors;
        document.getElementById('pendingDoctors').textContent = stats.users.pending_doctors;
        document.getElementById('totalRecords').textContent = stats.records.active;
        document.getElementById('recentUploads').textContent = stats.recent_activity.uploads_last_7_days;
        document.getElementById('recentRegistrations').textContent = stats.recent_activity.registrations_last_7_days;

        // Update badges
        document.getElementById('pendingBadge').textContent = stats.users.pending_doctors;
        
        // Update quick action badges
        const quickPendingBadge = document.getElementById('quickPendingBadge');
        if (quickPendingBadge) {
            quickPendingBadge.textContent = stats.users.pending_doctors;
        }

        // Load and display admin profile on dashboard
        displayAdminDashboardProfile();

    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Display admin profile on dashboard
function displayAdminDashboardProfile() {
    const user = getUserData();
    
    // Update admin name and email
    const nameEl = document.getElementById('adminDashName');
    const emailEl = document.getElementById('adminDashEmail');
    const rfidStatusEl = document.getElementById('adminDashRfidStatus');
    const memberSinceEl = document.getElementById('adminDashMemberSince');
    
    if (nameEl) nameEl.textContent = user.full_name || 'Admin';
    if (emailEl) emailEl.textContent = user.email || '';
    
    // Update RFID status
    if (rfidStatusEl) {
        if (user.rfid_id) {
            rfidStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Linked';
            rfidStatusEl.style.color = 'var(--success-color)';
        } else {
            rfidStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Not Linked';
            rfidStatusEl.style.color = 'var(--warning-color)';
        }
    }
    
    // Update member since
    if (memberSinceEl) {
        memberSinceEl.textContent = formatDate(user.created_at || new Date());
    }
}

// Load pending doctors
async function loadPendingDoctors() {
    try {
        const response = await apiCall(API_ENDPOINTS.PENDING_DOCTORS);
        pendingDoctors = response.pending_doctors || [];
        displayPendingDoctors();
    } catch (error) {
        console.error('Failed to load pending doctors:', error);
        pendingDoctors = [];
    }
}

// Display pending doctors
function displayPendingDoctors() {
    const tbody = document.getElementById('pendingDoctorsTableBody');

    if (pendingDoctors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No pending doctor verifications</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pendingDoctors.map(doctor => `
        <tr>
            <td>${doctor.full_name}</td>
            <td>${doctor.email}</td>
            <td>${doctor.phone || 'N/A'}</td>
            <td><span class="nmc-badge">${doctor.nmc_uid}</span></td>
            <td>${formatDate(doctor.created_at)}</td>
            <td>
                <button class="btn btn-success" style="padding: 6px 12px; margin-right: 8px;" 
                    onclick="verifyDoctor('${doctor._id}', 'approve')">
                    ✓ Approve
                </button>
                <button class="btn btn-danger" style="padding: 6px 12px;" 
                    onclick="verifyDoctor('${doctor._id}', 'reject')">
                    ✗ Reject
                </button>
            </td>
        </tr>
    `).join('');
}

// Verify doctor (approve or reject)
async function verifyDoctor(doctorId, action) {
    const actionText = action === 'approve' ? 'approve' : 'reject';

    if (!confirmAction(`Are you sure you want to ${actionText} this doctor?`)) {
        return;
    }

    showLoading();

    try {
        await apiCall(API_ENDPOINTS.VERIFY_DOCTOR(doctorId), {
            method: 'PATCH',
            body: JSON.stringify({ action })
        });

        showSuccess(`Doctor ${action}d successfully`);

        // Reload data
        await loadDashboardData();

    } catch (error) {
        showError(`Failed to ${actionText} doctor`);
    } finally {
        hideLoading();
    }
}

// Load all users
async function loadUsers() {
    try {
        const response = await apiCall(API_ENDPOINTS.ALL_USERS);
        allUsers = response.users || [];
        displayUsers(allUsers);
    } catch (error) {
        console.error('Failed to load users:', error);
        allUsers = [];
    }
}

// Display users in table with Delete button added
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">No users found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        // Get the appropriate ID based on role
        let roleSpecificId = '';
        if (user.role === 'doctor') {
            roleSpecificId = user.doctor_id ? 
                `<span style="font-family: monospace; background: #e3f2fd; padding: 4px 8px; border-radius: 4px; color: #1976d2; font-weight: 600;">${user.doctor_id}</span>` : 
                '<span style="color: #999;">Not assigned</span>';
        } else if (user.role === 'patient') {
            roleSpecificId = user.patient_id ? 
                `<span style="font-family: monospace; background: #e8f5e9; padding: 4px 8px; border-radius: 4px; color: #388e3c; font-weight: 600;">${user.patient_id}</span>` : 
                '<span style="color: #999;">Not assigned</span>';
        } else {
            roleSpecificId = '<span style="color: #999;">N/A</span>';
        }

        return `
        <tr>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>
                <span class="badge badge-info">
                    ${user.role}
                </span>
            </td>
            <td style="text-align: center;">${roleSpecificId}</td>
            <td style="text-align: center;">${user.nmc_uid ? `<span class="nmc-badge">${user.nmc_uid}</span>` : '<span style="color: #999;">N/A</span>'}</td>
            <td style="text-align: center;">
                ${user.rfid_id ? 
                    `<span style="font-family: monospace; background: #fff3cd; padding: 4px 8px; border-radius: 4px; color: #856404; font-weight: 600; font-size: 0.85rem;">
                        <i class="fas fa-id-card"></i> ${user.rfid_id.substring(0, 8)}...
                    </span>` : 
                    '<span style="color: #999;">Not Linked</span>'}
            </td>
            <td>
                <span class="badge ${user.is_active ? 'badge-success' : 'badge-warning'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
                ${user.role === 'doctor' && !user.is_verified ? 
                    '<span class="badge badge-warning" style="margin-left: 5px;">Unverified</span>' : ''}
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td style="white-space: nowrap;">
                ${(user.role === 'patient' || user.role === 'doctor') ? `
                <button class="btn btn-secondary" 
                    style="padding: 6px 12px; font-size: 0.85rem; margin-right: 8px;" 
                    onclick="openEditRfidModal('${user._id}', '${user.full_name}', '${user.rfid_id || ''}')">
                    <i class="fas fa-id-card"></i> RFID
                </button>
                ` : ''}
                <button class="btn ${user.is_active ? 'btn-danger' : 'btn-success'}" 
                    style="padding: 6px 12px; font-size: 0.85rem;" 
                    onclick="toggleUserStatus('${user._id}', ${user.is_active})">
                    ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-danger" 
                    style="padding: 6px 12px; margin-left: 8px; font-size: 0.85rem;" 
                    onclick="deleteUser('${user._id}')">
                    Delete
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

// Display audit logs
function displayAuditLogs() {
    const tbody = document.getElementById('auditLogsBody');

    if (auditLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No audit logs found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = auditLogs.map(log => `
        <tr>
            <td>${formatDate(log.timestamp)}</td>
            <td>${log.user_id || 'System'}</td>
            <td>
                <span class="badge badge-info">
                    ${log.action}
                </span>
            </td>
            <td>${log.resource_type}</td>
            <td>${log.ip_address || 'N/A'}</td>
        </tr>
    `).join('');
}

// Load audit logs
async function loadAuditLogs() {
    try {
        const response = await apiCall(API_ENDPOINTS.AUDIT_LOGS);
        auditLogs = response.logs || [];
        displayAuditLogs();
    } catch (error) {
        console.error('Failed to load audit logs:', error);
        auditLogs = [];
    }
}

// Filter users by role
function filterUsers(role) {
    let filteredUsers;

    if (role === 'all') {
        filteredUsers = allUsers;
    } else {
        filteredUsers = allUsers.filter(user => user.role === role);
    }

    displayUsers(filteredUsers);
}

// Toggle user status (activate/deactivate)
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';

    if (!confirmAction(`Are you sure you want to ${action} this user?`)) {
        return;
    }

    showLoading();

    try {
        await apiCall(API_ENDPOINTS.TOGGLE_USER_STATUS(userId), {
            method: 'PATCH'
        });

        showSuccess(`User ${action}d successfully`);

        await loadUsers();
        await loadStats();

    } catch (error) {
        showError(`Failed to ${action} user`);
    } finally {
        hideLoading();
    }
}

// New: Delete user
async function deleteUser(userId) {
    if (!confirmAction('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    showLoading();
    try {
        await apiCall(API_ENDPOINTS.DELETE_USER(userId), { method: 'DELETE' });
        showSuccess('User deleted successfully');
        // Reload users and stats after deletion
        await loadUsers();
        await loadStats();
    } catch (error) {
        showError('Failed to delete user');
    } finally {
        hideLoading();
    }
}

// Show section
function showSection(section) {
    // Hide all sections
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('pendingSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';
    document.getElementById('auditSection').style.display = 'none';
    document.getElementById('contactSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';

    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    switch(section) {
        case 'dashboard':
            document.getElementById('dashboardSection').style.display = 'block';
            break;
        case 'pending':
            document.getElementById('pendingSection').style.display = 'block';
            break;
        case 'users':
            document.getElementById('usersSection').style.display = 'block';
            break;
        case 'audit':
            document.getElementById('auditSection').style.display = 'block';
            break;
        case 'contact':
            document.getElementById('contactSection').style.display = 'block';
            loadContactMessages();
            break;
        case 'profile':
            document.getElementById('profileSection').style.display = 'block';
            loadAdminProfile();
            break;
    }
}


// RFID Management Functions
function openEditRfidModal(userId, userName, currentRfid) {
    const modal = document.getElementById('rfidModal');
    document.getElementById('rfidUserName').textContent = userName;
    document.getElementById('rfidUserId').value = userId;
    document.getElementById('rfidInput').value = currentRfid || '';
    modal.style.display = 'flex';
}

function closeRfidModal() {
    const modal = document.getElementById('rfidModal');
    modal.style.display = 'none';
    document.getElementById('rfidInput').value = '';
}

async function saveRfidChanges() {
    const userId = document.getElementById('rfidUserId').value;
    const rfidValue = document.getElementById('rfidInput').value.trim();

    showLoading();

    try {
        await apiCall(API_ENDPOINTS.UPDATE_USER_RFID(userId), {
            method: 'PATCH',
            body: JSON.stringify({ rfid_id: rfidValue || null })
        });

        showSuccess('RFID updated successfully');
        closeRfidModal();
        await loadUsers();

    } catch (error) {
        showError('Failed to update RFID');
    } finally {
        hideLoading();
    }
}

function clearRfidInput() {
    document.getElementById('rfidInput').value = '';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('rfidModal');
    if (event.target === modal) {
        closeRfidModal();
    }
}


// Mobile sidebar toggle
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('mobile-open');
    
    // Show/hide overlay
    if (sidebar.classList.contains('mobile-open')) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('active'), 10);
    } else {
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}


// ==================== CONTACT MESSAGES ====================

let contactMessages = [];
let currentContactFilter = 'all';

async function loadContactMessages(status = null) {
    try {
        const url = status ? `/api/contact/messages?status=${status}` : '/api/contact/messages';
        const response = await apiCall(url);
        
        contactMessages = response.messages || [];
        const counts = response.counts || {};
        
        // Update counts
        document.getElementById('unreadCount').textContent = counts.unread || 0;
        document.getElementById('readCount').textContent = counts.read || 0;
        document.getElementById('repliedCount').textContent = counts.replied || 0;
        document.getElementById('totalContactCount').textContent = counts.total || 0;
        
        // Update badge in sidebar
        const unreadBadge = document.getElementById('unreadBadge');
        if (unreadBadge) {
            unreadBadge.textContent = counts.unread || 0;
            unreadBadge.style.display = (counts.unread > 0) ? 'inline-block' : 'none';
        }
        
        // Update quick action badge
        const quickUnreadBadge = document.getElementById('quickUnreadBadge');
        if (quickUnreadBadge) {
            quickUnreadBadge.textContent = counts.unread || 0;
            quickUnreadBadge.style.display = (counts.unread > 0) ? 'inline-block' : 'none';
        }
        
        displayContactMessages();
    } catch (error) {
        console.error('Failed to load contact messages:', error);
        showError('Failed to load contact messages');
    }
}

function displayContactMessages() {
    const tbody = document.getElementById('contactMessagesBody');
    
    if (contactMessages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No contact messages found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = contactMessages.map(msg => {
        const statusClass = msg.status === 'unread' ? 'unread' : msg.status === 'read' ? 'read' : 'replied';
        const statusIcon = msg.status === 'unread' ? 'envelope' : msg.status === 'read' ? 'envelope-open' : 'reply';
        const rowClass = msg.status === 'unread' ? 'unread-row' : '';
        
        return `
            <tr class="${rowClass}">
                <td class="contact-date">${formatDate(msg.submitted_at)}</td>
                <td class="contact-name">${msg.name}</td>
                <td>
                    <a href="mailto:${msg.email}" class="contact-email">
                        ${msg.email}
                    </a>
                </td>
                <td>
                    <div class="contact-message-preview">
                        <div class="contact-message-text">
                            ${msg.message}
                        </div>
                        ${msg.message.length > 100 ? `
                            <button class="contact-view-full-btn" onclick="viewFullMessage('${msg._id}')">
                                <i class="fas fa-eye"></i> View Full Message
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="contact-status-badge status-${statusClass}">
                        <i class="fas fa-${statusIcon}"></i> ${msg.status}
                    </span>
                </td>
                <td>
                    <div class="contact-actions">
                        ${msg.status === 'unread' ? `
                            <button class="contact-action-btn btn-read" onclick="markAsRead('${msg._id}')" title="Mark as Read">
                                <i class="fas fa-envelope-open"></i>
                            </button>
                        ` : ''}
                        ${msg.status !== 'replied' ? `
                            <button class="contact-action-btn btn-reply" onclick="markAsReplied('${msg._id}')" title="Mark as Replied">
                                <i class="fas fa-reply"></i>
                            </button>
                        ` : ''}
                        <button class="contact-action-btn btn-delete" onclick="deleteContactMessage('${msg._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterContactMessages(filter) {
    currentContactFilter = filter;
    
    // Update active button state
    document.querySelectorAll('.contact-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (filter === 'all') {
        loadContactMessages();
    } else {
        loadContactMessages(filter);
    }
}

function viewFullMessage(messageId) {
    const message = contactMessages.find(m => m._id === messageId);
    if (!message) return;
    
    const statusClass = message.status === 'unread' ? 'unread' : message.status === 'read' ? 'read' : 'replied';
    
    const modal = `
        <div class="contact-message-modal" onclick="this.remove()">
            <div class="contact-message-modal-content" onclick="event.stopPropagation()">
                <div class="contact-modal-header">
                    <i class="fas fa-envelope"></i>
                    <h2>Contact Message</h2>
                </div>
                <div class="contact-modal-info">
                    <strong>From:</strong> ${message.name}<br>
                    <strong>Email:</strong> <a href="mailto:${message.email}" class="contact-email">${message.email}</a><br>
                    <strong>Date:</strong> ${formatDate(message.submitted_at)}<br>
                    <strong>Status:</strong> <span class="contact-status-badge status-${statusClass}">${message.status}</span>
                </div>
                <div class="contact-modal-message">
                    ${message.message}
                </div>
                <div class="contact-modal-actions">
                    <button class="contact-modal-btn btn-close" onclick="this.closest('.contact-message-modal').remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <a href="mailto:${message.email}?subject=Re: Your message to Bharath Medicare" class="contact-modal-btn btn-reply-email">
                        <i class="fas fa-reply"></i> Reply via Email
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function markAsRead(messageId) {
    try {
        await apiCall(`/api/contact/messages/${messageId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'read' })
        });
        
        showSuccess('Message marked as read');
        loadContactMessages(currentContactFilter === 'all' ? null : currentContactFilter);
    } catch (error) {
        showError('Failed to update message status');
    }
}

async function markAsReplied(messageId) {
    try {
        await apiCall(`/api/contact/messages/${messageId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'replied' })
        });
        
        showSuccess('Message marked as replied');
        loadContactMessages(currentContactFilter === 'all' ? null : currentContactFilter);
    } catch (error) {
        showError('Failed to update message status');
    }
}

async function deleteContactMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiCall(`/api/contact/messages/${messageId}`, {
            method: 'DELETE'
        });
        
        showSuccess('Message deleted successfully');
        loadContactMessages(currentContactFilter === 'all' ? null : currentContactFilter);
    } catch (error) {
        showError('Failed to delete message');
    }
}

// Admin Profile Functions

// Load admin profile
async function loadAdminProfile() {
    try {
        const user = getUserData();
        
        // Fill profile fields
        document.getElementById('adminName').value = user.full_name || '';
        document.getElementById('adminEmail').value = user.email || '';
        document.getElementById('adminCreated').value = formatDate(user.created_at || new Date());
        
        // Update RFID status display
        updateAdminRfidStatusDisplay(user);
        
        // RFID input field handling
        const rfidInput = document.getElementById('adminRfidInput');
        const clearBtn = document.getElementById('clearAdminRfidBtn');
        const helpText = document.getElementById('adminRfidHelpText');
        
        rfidInput.value = user.rfid_id || '';
        
        if (user.rfid_id) {
            // RFID already linked - completely lock it
            rfidInput.readOnly = true;
            rfidInput.style.background = 'var(--bg-secondary)';
            rfidInput.style.cursor = 'not-allowed';
            rfidInput.placeholder = 'RFID card permanently linked';
            clearBtn.style.display = 'none';
            
            // Hide the assign button and show update button instead
            const assignBtn = document.querySelector('button[onclick="assignAdminRfid()"]');
            if (assignBtn) {
                assignBtn.style.display = 'none';
            }
            
            // Show update button
            const updateBtn = document.getElementById('updateAdminRfidBtn');
            if (updateBtn) {
                updateBtn.style.display = 'inline-flex';
            }
            
            helpText.innerHTML = '<i class="fas fa-lock"></i> <strong>RFID card is permanently linked.</strong> This card will remain assigned to your account. Only you can update it using the "Update RFID" button.';
            helpText.style.color = 'var(--warning-color)';
        } else {
            // No RFID yet - allow admin to link it
            rfidInput.readOnly = false;
            rfidInput.style.background = '';
            rfidInput.style.cursor = '';
            rfidInput.placeholder = 'Click here and scan your RFID card';
            clearBtn.style.display = 'inline-flex';
            
            // Show assign button, hide update button
            const assignBtn = document.querySelector('button[onclick="assignAdminRfid()"]');
            if (assignBtn) {
                assignBtn.style.display = 'inline-flex';
            }
            
            const updateBtn = document.getElementById('updateAdminRfidBtn');
            if (updateBtn) {
                updateBtn.style.display = 'none';
            }
            
            helpText.innerHTML = '<i class="fas fa-shield-alt"></i> Your RFID card will be permanently linked to your admin account for secure access.';
            helpText.style.color = 'var(--text-secondary)';
        }
        
    } catch (error) {
        console.error('Failed to load admin profile:', error);
        showError('Failed to load profile');
    }
}

// Update RFID status display
function updateAdminRfidStatusDisplay(user) {
    const rfidStatusField = document.getElementById('adminRfidStatus');
    if (!rfidStatusField) return;
    
    if (user.rfid_id) {
        rfidStatusField.value = `✓ Linked: ${user.rfid_id}`;
        rfidStatusField.style.color = 'var(--success-color)';
        rfidStatusField.style.fontWeight = '600';
    } else {
        rfidStatusField.value = '⚠ No RFID card linked';
        rfidStatusField.style.color = 'var(--warning-color)';
        rfidStatusField.style.fontWeight = 'normal';
    }
}

// Assign RFID card to admin (first time only)
async function assignAdminRfid() {
    const user = getUserData();
    
    // Prevent assignment if RFID already exists
    if (user.rfid_id) {
        showError('RFID card is already assigned. Use "Update RFID" button to change it.');
        return;
    }
    
    const rfidInput = document.getElementById('adminRfidInput');
    const rfidValue = rfidInput.value.trim();
    
    if (!rfidValue) {
        showError('Please scan or enter an RFID card ID');
        rfidInput.focus();
        return;
    }
    
    if (rfidValue.length < 8) {
        showError('RFID card ID must be at least 8 characters');
        return;
    }
    
    const confirmMsg = `⚠️ IMPORTANT: Once assigned, this RFID card will be permanently linked to your admin account.\n\nRFID Card: ${rfidValue}\n\nAre you sure you want to proceed?`;
    
    if (!confirmAction(confirmMsg)) {
        return;
    }
    
    showLoading();
    
    try {
        // Update admin's own RFID
        const response = await apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
            method: 'POST',
            body: JSON.stringify({
                rfid_id: rfidValue
            })
        });
        
        // Update stored user data
        setUserData(response.user);
        
        // Update display
        updateAdminRfidStatusDisplay(response.user);
        
        // Update input field
        const rfidInput = document.getElementById('adminRfidInput');
        const clearBtn = document.getElementById('clearAdminRfidBtn');
        const helpText = document.getElementById('adminRfidHelpText');
        
        rfidInput.value = response.user.rfid_id;
        rfidInput.readOnly = true;
        rfidInput.style.background = 'var(--bg-secondary)';
        rfidInput.style.cursor = 'not-allowed';
        rfidInput.placeholder = 'RFID card permanently linked';
        clearBtn.style.display = 'none';
        
        // Hide assign button, show update button
        const assignBtn = document.querySelector('button[onclick="assignAdminRfid()"]');
        if (assignBtn) assignBtn.style.display = 'none';
        
        const updateBtn = document.getElementById('updateAdminRfidBtn');
        if (updateBtn) updateBtn.style.display = 'inline-flex';
        
        helpText.innerHTML = '<i class="fas fa-lock"></i> <strong>RFID card is permanently linked.</strong> This card will remain assigned to your account.';
        helpText.style.color = 'var(--warning-color)';
        
        showSuccess('RFID card assigned successfully! You can now use it at the hospital portal.');
        
    } catch (error) {
        console.error('RFID assignment error:', error);
        showError(error.message || 'Failed to assign RFID card');
    } finally {
        hideLoading();
    }
}

// Update RFID card (for already assigned cards)
async function updateAdminRfid() {
    const user = getUserData();
    
    if (!user.rfid_id) {
        showError('No RFID card is currently assigned. Use "Assign RFID Card" instead.');
        return;
    }
    
    // Prompt for new RFID
    const newRfid = prompt(`⚠️ UPDATE RFID CARD\n\nCurrent RFID: ${user.rfid_id}\n\nPlease scan or enter your NEW RFID card ID:`);
    
    if (!newRfid) {
        return; // User cancelled
    }
    
    const trimmedRfid = newRfid.trim();
    
    if (trimmedRfid.length < 8) {
        showError('RFID card ID must be at least 8 characters');
        return;
    }
    
    if (trimmedRfid === user.rfid_id) {
        showError('New RFID card is the same as the current one');
        return;
    }
    
    const confirmMsg = `⚠️ CONFIRM RFID UPDATE\n\nYou are about to change your RFID card:\n\nFrom: ${user.rfid_id}\nTo: ${trimmedRfid}\n\nThis action will update your permanent RFID assignment.\n\nAre you absolutely sure?`;
    
    if (!confirmAction(confirmMsg)) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
            method: 'POST',
            body: JSON.stringify({
                rfid_id: trimmedRfid
            })
        });
        
        // Update stored user data
        setUserData(response.user);
        
        // Update display
        updateAdminRfidStatusDisplay(response.user);
        
        // Update input field
        const rfidInput = document.getElementById('adminRfidInput');
        rfidInput.value = response.user.rfid_id;
        
        showSuccess('RFID card updated successfully! Your new card is now active.');
        
        // Reload profile to refresh all displays
        await loadAdminProfile();
        
    } catch (error) {
        console.error('RFID update error:', error);
        showError(error.message || 'Failed to update RFID card');
    } finally {
        hideLoading();
    }
}

// Clear admin RFID field
function clearAdminRfidField() {
    const user = getUserData();
    if (!user.rfid_id) {
        document.getElementById('adminRfidInput').value = '';
        showSuccess('Field cleared');
    } else {
        showError('RFID is already linked and cannot be cleared. Use "Update RFID" to change it.');
    }
}
