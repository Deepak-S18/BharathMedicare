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

        // Update badge
        document.getElementById('pendingBadge').textContent = stats.users.pending_doctors;

    } catch (error) {
        console.error('Failed to load stats:', error);
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
        const statusClass = msg.status === 'unread' ? 'danger' : msg.status === 'read' ? 'info' : 'success';
        const statusIcon = msg.status === 'unread' ? 'envelope' : msg.status === 'read' ? 'envelope-open' : 'reply';
        
        return `
            <tr style="${msg.status === 'unread' ? 'background: rgba(255, 68, 68, 0.05);' : ''}">
                <td>${formatDate(msg.submitted_at)}</td>
                <td><strong>${msg.name}</strong></td>
                <td>
                    <a href="mailto:${msg.email}" style="color: var(--primary-color);">
                        ${msg.email}
                    </a>
                </td>
                <td style="max-width: 300px;">
                    <div style="max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
                        ${msg.message}
                    </div>
                    ${msg.message.length > 100 ? `
                        <button class="btn btn-sm btn-secondary" onclick="viewFullMessage('${msg._id}')" style="margin-top: 8px;">
                            <i class="fas fa-eye"></i> View Full
                        </button>
                    ` : ''}
                </td>
                <td>
                    <span class="badge badge-${statusClass}">
                        <i class="fas fa-${statusIcon}"></i> ${msg.status}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${msg.status === 'unread' ? `
                            <button class="btn btn-sm btn-info" onclick="markAsRead('${msg._id}')" title="Mark as Read">
                                <i class="fas fa-envelope-open"></i>
                            </button>
                        ` : ''}
                        ${msg.status !== 'replied' ? `
                            <button class="btn btn-sm btn-success" onclick="markAsReplied('${msg._id}')" title="Mark as Replied">
                                <i class="fas fa-reply"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="deleteContactMessage('${msg._id}')" title="Delete">
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
    if (filter === 'all') {
        loadContactMessages();
    } else {
        loadContactMessages(filter);
    }
}

function viewFullMessage(messageId) {
    const message = contactMessages.find(m => m._id === messageId);
    if (!message) return;
    
    const modal = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
            <div style="background: var(--card-bg); padding: 32px; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <h2 style="margin-bottom: 24px;">
                    <i class="fas fa-envelope"></i> Contact Message
                </h2>
                <div style="margin-bottom: 16px;">
                    <strong>From:</strong> ${message.name}<br>
                    <strong>Email:</strong> <a href="mailto:${message.email}">${message.email}</a><br>
                    <strong>Date:</strong> ${formatDate(message.submitted_at)}<br>
                    <strong>Status:</strong> <span class="badge badge-${message.status === 'unread' ? 'danger' : message.status === 'read' ? 'info' : 'success'}">${message.status}</span>
                </div>
                <div style="background: var(--bg-color); padding: 16px; border-radius: 8px; margin-bottom: 24px; white-space: pre-wrap; word-wrap: break-word;">
                    ${message.message}
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="this.closest('div[style*=fixed]').remove()">
                        Close
                    </button>
                    <a href="mailto:${message.email}?subject=Re: Your message to Bharath Medicare" class="btn btn-primary">
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
