// Doctor Dashboard JavaScript

let myPatients = [];
let currentPatientRecords = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    const user = getUserData();
    
    if (user.role !== 'doctor') {
        showError('Access denied. This page is for doctors only.');
        setTimeout(() => {
            redirectToDashboard(user.role);
        }, 2000);
        return;
    }
    
    // Display doctor name
    document.getElementById('doctorName').textContent = user.full_name;
    
    // Load profile first to check completion status
    await loadProfile();
    const updatedUser = getUserData();
    
    // Check if profile is complete
    if (updatedUser.hasOwnProperty('is_profile_complete') && updatedUser.is_profile_complete === false) {
        showError('Profile completion required. Please fill in all required fields to access the full dashboard.', 5000);
        
        // Show only the profile section
        showSection('profile');
        
        // Disable all other sidebar links
        document.querySelectorAll('.sidebar-menu-link').forEach(link => {
            if (!link.getAttribute('onclick').includes('profile')) {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
                link.classList.remove('active');
            } else {
                link.classList.add('active');
            }
        });
        
        return;
    }
    
    await loadDashboardData();
});

// Load all dashboard data
async function loadDashboardData() {
    showLoading();
    
    try {
        await Promise.all([
            loadProfile(),
            loadPatients(),
            loadAppointments(),
            loadDoctorCard()
        ]);
        
        updateStats();
    } catch (error) {
        showError('Failed to load dashboard data');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Load profile
async function loadProfile() {
    try {
        const response = await apiCall(API_ENDPOINTS.CURRENT_USER);
        const user = response.user;
        
        console.log('Loading profile data:', user);
        
        // Update local storage
        setUserData(user);
        
        // Display profile data
        displayProfile(user);
        
        // Fill form fields
        document.getElementById('profileName').value = user.full_name || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileGender').value = user.gender || '';
        document.getElementById('profileDob').value = user.date_of_birth || '';
        document.getElementById('profileBloodGroup').value = user.blood_group || '';
        document.getElementById('profileNmc').value = user.nmc_uid || '';
        document.getElementById('profileAddress').value = user.address || '';
        
        // Professional fields
        document.getElementById('profileSpecialization').value = user.specialization || '';
        document.getElementById('profileExperience').value = user.years_of_experience || '';
        document.getElementById('profileQualification').value = user.qualification || '';
        document.getElementById('profileHospital').value = user.hospital_affiliation || '';
        document.getElementById('profileFee').value = user.consultation_fee || '';
        document.getElementById('profileLanguages').value = arrayToCommaSeparated(user.languages_spoken);
        document.getElementById('profileBio').value = user.bio || '';
        
        // Account info
        document.getElementById('profileDoctorId').value = user.doctor_id || 'N/A';
        document.getElementById('profileCreated').value = formatDate(user.created_at || new Date());
        
        // RFID info (optional) - lock if already set
        const rfidInput = document.getElementById('profileRfidId');
        const clearRfidBtn = document.getElementById('clearRfidBtn');
        const rfidHelpText = document.getElementById('rfidHelpText');
        
        rfidInput.value = user.rfid_id || '';
        
        if (user.rfid_id) {
            // RFID already linked - make it read-only
            rfidInput.readOnly = true;
            rfidInput.style.background = 'var(--bg-secondary)';
            rfidInput.style.cursor = 'not-allowed';
            rfidInput.placeholder = 'RFID linked - Contact admin to change';
            clearRfidBtn.style.display = 'none';
            rfidHelpText.innerHTML = '<i class="fas fa-lock"></i> RFID is locked. Only admin can modify it. Contact your administrator to update.';
            rfidHelpText.style.color = 'var(--warning-color)';
        } else {
            // No RFID yet - allow user to link it
            rfidInput.readOnly = false;
            rfidInput.style.background = '';
            rfidInput.style.cursor = '';
            clearRfidBtn.style.display = 'inline-flex';
        }
        
        console.log('Profile form fields populated successfully');
        
        // Display profile photo
        displayDoctorProfilePhoto(user.profile_photo);
        
        // Setup photo upload listeners
        setupPhotoUploadListeners();
        
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Setup photo upload event listeners
function setupPhotoUploadListeners() {
    const photoInput = document.getElementById('doctorPhotoInput');
    const deleteBtn = document.getElementById('deleteDoctorPhotoBtn');
    
    if (photoInput && !photoInput.hasAttribute('data-listener')) {
        photoInput.setAttribute('data-listener', 'true');
        photoInput.onchange = handleDoctorPhotoSelect;
    }
    
    if (deleteBtn && !deleteBtn.hasAttribute('data-listener')) {
        deleteBtn.setAttribute('data-listener', 'true');
        deleteBtn.onclick = handleDeleteDoctorPhoto;
    }
}

// Display doctor profile photo
function displayDoctorProfilePhoto(photoUrl) {
    const preview = document.getElementById('doctorProfilePhotoPreview');
    const deleteBtn = document.getElementById('deleteDoctorPhotoBtn');
    
    if (!preview) return;
    
    if (photoUrl) {
        preview.innerHTML = `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profile Photo">`;
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
        preview.innerHTML = '<i class="fas fa-user-md" style="font-size: 4rem;"></i>';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}

// Handle doctor photo selection
function handleDoctorPhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
        showError(validation.error);
        event.target.value = '';
        return;
    }
    
    // Preview photo
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('doctorProfilePhotoPreview');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profile Preview">`;
        }
    };
    reader.readAsDataURL(file);
    
    // Upload photo immediately
    uploadDoctorProfilePhoto(file);
}

// Upload doctor profile photo
async function uploadDoctorProfilePhoto(file) {
    showLoading();
    
    try {
        const response = await apiCallPhoto(API_ENDPOINTS.UPLOAD_PHOTO, file);
        
        // Update user data
        setUserData(response.user);
        
        // Display updated photo
        displayDoctorProfilePhoto(response.photo_url);
        
        // Update doctor card if loaded
        await loadDoctorCard();
        
        showSuccess('Profile photo uploaded successfully!');
        
    } catch (error) {
        showError(error.message || 'Failed to upload photo');
        await loadProfile();
    } finally {
        hideLoading();
    }
}

// Delete doctor profile photo
async function handleDeleteDoctorPhoto() {
    if (!confirmAction('Are you sure you want to remove your profile photo?')) return;
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.DELETE_PHOTO, {
            method: 'POST'
        });
        
        // Reset preview
        displayDoctorProfilePhoto(null);
        
        // Update user data
        const user = getUserData();
        user.profile_photo = null;
        setUserData(user);
        
        // Update doctor card
        await loadDoctorCard();
        
        showSuccess('Profile photo removed successfully');
        
    } catch (error) {
        showError('Failed to delete photo');
    } finally {
        hideLoading();
    }
}

// Load patients with access
async function loadPatients() {
    try {
        const response = await apiCall(API_ENDPOINTS.MY_PERMISSIONS);
        myPatients = response.permissions || [];
        displayPatients();
        displayRecentPatients();
    } catch (error) {
        console.error('Failed to load patients:', error);
        myPatients = [];
    }
}

// Update statistics
function updateStats() {
    document.getElementById('totalPatients').textContent = myPatients.length;
    
    // Count total accessible records (simplified - would need separate API call for exact count)
    document.getElementById('accessibleRecords').textContent = myPatients.length * 5; // Placeholder
    
    // Display Doctor ID
    const user = getUserData();
    document.getElementById('doctorIdDisplay').textContent = user.doctor_id || 'N/A';
}

// Display profile
function displayProfile(profile) {
    const profileDiv = document.getElementById('profileInfo');
    profileDiv.innerHTML = `
        <div style="display: grid; gap: 16px;">
            <div>
                <strong>Name:</strong> Dr. ${profile.full_name}
            </div>
            <div>
                <strong>Specialization:</strong> ${profile.specialization || 'Not specified'}
            </div>
            <div>
                <strong>Experience:</strong> ${profile.years_of_experience ? profile.years_of_experience + ' years' : 'Not specified'}
            </div>
            <div>
                <strong>Email:</strong> ${profile.email}
            </div>
            <div>
                <strong>Phone:</strong> ${profile.phone || 'Not provided'}
            </div>
            <div>
                <strong>Total Patients:</strong> ${myPatients.length}
            </div>
            <div>
                <strong>Account Created:</strong> ${formatDate(profile.created_at)}
            </div>
        </div>
    `;
}

// Handle doctor profile update
async function handleUpdateDoctorProfile(event) {
    event.preventDefault();
    
    console.log('Form submitted - starting profile update');
    
    showLoading();
    
    try {
        const updateData = {
            full_name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value,
            gender: document.getElementById('profileGender').value,
            date_of_birth: document.getElementById('profileDob').value,
            blood_group: document.getElementById('profileBloodGroup').value,
            address: document.getElementById('profileAddress').value,
            // Professional fields
            specialization: document.getElementById('profileSpecialization').value,
            years_of_experience: parseInt(document.getElementById('profileExperience').value) || 0,
            qualification: document.getElementById('profileQualification').value,
            hospital_affiliation: document.getElementById('profileHospital').value,
            consultation_fee: parseInt(document.getElementById('profileFee').value) || 0,
            languages_spoken: parseCommaSeparated(document.getElementById('profileLanguages').value),
            bio: document.getElementById('profileBio').value
        };
        
        // Only include RFID if user doesn't have one yet (first-time linking)
        const user = getUserData();
        if (!user.rfid_id) {
            const rfidValue = document.getElementById('profileRfidId').value.trim();
            if (rfidValue) {
                profileData.rfid_id = rfidValue;
            }
        }
        
        console.log('Update data:', updateData);
        
        const response = await apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
            method: 'POST',
            body: JSON.stringify(updateData)
        });
        
        console.log('Update response:', response);
        
        // Update stored user data
        setUserData(response.user);
        
        showSuccess('Profile updated successfully!');
        
        // Reload profile to show updated data
        await loadProfile();
        
        // Check if profile is now complete
        if (response.user && response.user.is_profile_complete === true) {
            showSuccess('Profile complete! Accessing full dashboard...', 2000);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            // Just reload the profile display without full page reload
            displayProfile(response.user);
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showError(error.message || 'Failed to update profile');
    } finally {
        hideLoading();
    }
}

// Display patients in table
function displayPatients() {
    const tbody = document.getElementById('patientsTableBody');
    
    if (myPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No patients have granted you access yet</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = myPatients.map(perm => {
        // Check if patient data exists
        if (!perm.patient) {
            console.error('Patient data missing for permission:', perm);
            return `
                <tr>
                    <td colspan="6" class="text-center" style="color: var(--danger-color);">
                        Error: Patient data not available
                    </td>
                </tr>
            `;
        }
        
        return `
            <tr>
                <td>${perm.patient.full_name || 'N/A'}</td>
                <td>${perm.patient.email || 'N/A'}</td>
                <td>${perm.patient.phone || 'Not provided'}</td>
                <td>${formatDate(perm.granted_at)}</td>
                <td>
                    <span style="padding: 4px 12px; background: var(--success-color); color: white; border-radius: 12px; font-size: 0.85rem;">
                        ${perm.permission_level}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary" style="padding: 6px 12px;" 
                        onclick="viewPatientRecords('${perm.patient_id}', '${perm.patient.full_name || 'Patient'}')">
                        View Records
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Display recent patients
function displayRecentPatients() {
    const container = document.getElementById('recentPatientsList');
    const recentPatients = myPatients.slice(0, 5);
    
    if (recentPatients.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No patients yet. Wait for patients to grant you access.</p>';
        return;
    }
    
    container.innerHTML = recentPatients.map(perm => {
        if (!perm.patient) {
            return '<p style="color: var(--danger-color);">Error loading patient data</p>';
        }
        
        return `
            <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${perm.patient.full_name || 'N/A'}</strong><br>
                    <small style="color: var(--text-secondary);">Access granted: ${formatDate(perm.granted_at)}</small>
                </div>
                <button class="btn btn-primary" style="padding: 6px 12px;" 
                    onclick="viewPatientRecords('${perm.patient_id}', '${perm.patient.full_name || 'Patient'}')">
                    View
                </button>
            </div>
        `;
    }).join('');
}

// View patient records
async function viewPatientRecords(patientId, patientName) {
    showLoading();
    
    try {
        const response = await apiCall(API_ENDPOINTS.PATIENT_RECORDS(patientId));
        const records = response.records || [];
        
        document.getElementById('modalPatientName').textContent = `${patientName}'s Medical Records`;
        
        if (records.length === 0) {
            document.getElementById('modalRecordsList').innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No medical records found for this patient.</p>
                </div>
            `;
        } else {
            document.getElementById('modalRecordsList').innerHTML = `
                <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <strong><i class="fas fa-info-circle"></i> Total Records:</strong> ${records.length}
                </div>
                <div style="display: grid; gap: 12px;">
                    ${records.map(record => `
                        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: white;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 8px 0; color: var(--primary-color);">
                                        <i class="fas fa-file-medical"></i> ${record.file_name}
                                    </h4>
                                    <p style="margin: 4px 0; color: var(--text-secondary); font-size: 0.9rem;">
                                        <i class="fas fa-calendar"></i> Uploaded: ${formatDate(record.uploaded_at)}
                                    </p>
                                    ${record.description ? `
                                        <p style="margin: 8px 0 0 0; color: var(--text-primary);">
                                            <strong>Description:</strong> ${record.description}
                                        </p>
                                    ` : ''}
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-secondary" style="padding: 8px 16px; white-space: nowrap;" 
                                        onclick="viewRecord('${record._id}', '${record.file_name}', '${record.file_type}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="btn btn-primary" style="padding: 8px 16px; white-space: nowrap;" 
                                        onclick="downloadPatientRecord('${record._id}', '${record.file_name}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                </div>
                            </div>
                            <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-secondary); padding-top: 8px; border-top: 1px solid #e2e8f0;">
                                <span><i class="fas fa-file"></i> ${record.file_type}</span>
                                <span><i class="fas fa-lock"></i> Encrypted</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        document.getElementById('recordsModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Failed to load patient records:', error);
        showError(error.message || 'Failed to load patient records');
    } finally {
        hideLoading();
    }
}

// Close records modal
function closeRecordsModal() {
    document.getElementById('recordsModal').style.display = 'none';
}

// View record in modal
async function viewRecord(recordId, fileName, fileType) {
    showLoading();
    
    try {
        const token = getAuthToken();
        const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_RECORD(recordId)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load record');
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Set file name
        document.getElementById('viewerFileName').innerHTML = `<i class="fas fa-file-medical"></i> ${fileName}`;
        
        // Set download button
        document.getElementById('downloadFromViewer').onclick = () => {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            a.click();
            showSuccess('Download started');
        };
        
        // Display content based on file type
        const viewerContent = document.getElementById('recordViewerContent');
        
        if (fileType.includes('pdf')) {
            // PDF viewer
            viewerContent.innerHTML = `
                <iframe src="${blobUrl}" style="width: 100%; height: 100%; min-height: 600px; border: none; border-radius: 8px;"></iframe>
            `;
        } else if (fileType.includes('image')) {
            // Image viewer
            viewerContent.innerHTML = `
                <div style="text-align: center; background: white; padding: 20px; border-radius: 8px;">
                    <img src="${blobUrl}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="${fileName}">
                </div>
            `;
        } else if (fileType.includes('text')) {
            // Text viewer
            const text = await blob.text();
            viewerContent.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">
                    ${text}
                </div>
            `;
        } else {
            // Unsupported format - show download option
            viewerContent.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 8px;">
                    <i class="fas fa-file" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 12px;">Preview Not Available</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        This file type (${fileType}) cannot be previewed in the browser.
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('downloadFromViewer').click()">
                        <i class="fas fa-download"></i> Download to View
                    </button>
                </div>
            `;
        }
        
        // Show modal
        document.getElementById('recordViewerModal').style.display = 'flex';
        
    } catch (error) {
        console.error('View record error:', error);
        showError(error.message || 'Failed to view record');
    } finally {
        hideLoading();
    }
}

// Close record viewer
function closeRecordViewer() {
    document.getElementById('recordViewerModal').style.display = 'none';
    // Clean up blob URLs
    const iframe = document.querySelector('#recordViewerContent iframe');
    if (iframe && iframe.src) {
        URL.revokeObjectURL(iframe.src);
    }
    const img = document.querySelector('#recordViewerContent img');
    if (img && img.src) {
        URL.revokeObjectURL(img.src);
    }
}

// Download patient record
async function downloadPatientRecord(recordId, fileName) {
    showLoading();
    
    try {
        const token = getAuthToken();
        const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_RECORD(recordId)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Download failed');
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        showSuccess('Download started successfully');
        
    } catch (error) {
        console.error('Download error:', error);
        showError(error.message || 'Download failed');
    } finally {
        hideLoading();
    }
}

// Load appointments
let myAppointments = [];

async function loadAppointments() {
    try {
        const response = await apiCall(API_ENDPOINTS.MY_APPOINTMENTS);
        myAppointments = response.appointments || [];
        displayAppointments();
    } catch (error) {
        console.error('Failed to load appointments:', error);
        myAppointments = [];
    }
}

// Display appointments
function displayAppointments() {
    const tbody = document.getElementById('appointmentsTableBody');
    
    if (myAppointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No appointment requests yet</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = myAppointments.map(apt => {
        const statusColors = {
            'pending': 'warning',
            'confirmed': 'success',
            'rejected': 'danger',
            'cancelled': 'secondary',
            'completed': 'info'
        };
        
        const statusColor = statusColors[apt.status] || 'secondary';
        
        let actionButtons = '';
        if (apt.status === 'pending') {
            actionButtons = `
                <button class="btn btn-success" style="padding: 6px 12px; margin-right: 4px;" 
                    onclick="approveAppointment('${apt._id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" style="padding: 6px 12px;" 
                    onclick="rejectAppointment('${apt._id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        } else if (apt.status === 'confirmed' && !apt.otp_verified) {
            actionButtons = `
                <button class="btn btn-warning" style="padding: 6px 12px;" 
                    onclick="verifyAppointmentOTP('${apt._id}')">
                    <i class="fas fa-key"></i> Verify OTP
                </button>
            `;
        } else if (apt.status === 'confirmed' && apt.otp_verified && !apt.prescription) {
            actionButtons = `
                <span style="color: #4caf50; font-size: 0.85rem; margin-right: 8px;">
                    <i class="fas fa-check-circle"></i> Verified
                </span>
                <button class="btn btn-primary" style="padding: 6px 12px;" 
                    onclick="showPrescriptionForm('${apt._id}', '${apt.patient?.full_name || 'Patient'}')">
                    <i class="fas fa-prescription"></i> Add Prescription
                </button>
            `;
        } else if (apt.status === 'completed') {
            actionButtons = `
                <button class="btn btn-info btn-sm" style="padding: 6px 12px; margin-right: 4px;" 
                    onclick="viewPrescription('${apt._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-secondary btn-sm" style="padding: 6px 12px;" 
                    onclick="deleteAppointmentDoctor('${apt._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (apt.status === 'cancelled' || apt.status === 'rejected') {
            actionButtons = `
                <button class="btn btn-secondary btn-sm" style="padding: 6px 12px;" 
                    onclick="deleteAppointmentDoctor('${apt._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else {
            actionButtons = `<span style="color: var(--text-secondary);">No actions</span>`;
        }
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-weight: 600; color: var(--primary-color); font-family: monospace;">${apt.appointment_id || 'N/A'}</span>
                        <button onclick="copyToClipboard('${apt.appointment_id}', 'Appointment ID copied!')" 
                                style="background: none; border: none; cursor: pointer; padding: 2px 6px; color: var(--primary-color);" 
                                title="Copy Appointment ID">
                            <i class="fas fa-copy" style="font-size: 0.85rem;"></i>
                        </button>
                    </div>
                </td>
                <td>${apt.patient?.full_name || 'N/A'}</td>
                <td>${formatDate(apt.appointment_date)}</td>
                <td>${apt.appointment_time}</td>
                <td>${apt.reason || 'Not specified'}</td>
                <td>
                    <span class="badge badge-${statusColor}" style="padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">
                        ${apt.status.toUpperCase()}
                    </span>
                </td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

// Approve appointment
async function approveAppointment(appointmentId) {
    if (!confirm('Approve this appointment? You will gain access to the patient\'s medical records.')) {
        return;
    }
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.APPROVE_APPOINTMENT(appointmentId), {
            method: 'POST'
        });
        
        showSuccess('Appointment approved! You now have access to patient records.');
        
        // Reload data
        await loadAppointments();
        await loadPatients();
        updateStats();
        
    } catch (error) {
        showError(error.message || 'Failed to approve appointment');
    } finally {
        hideLoading();
    }
}

// Reject appointment
async function rejectAppointment(appointmentId) {
    if (!confirm('Reject this appointment request?')) {
        return;
    }
    
    showLoading();
    
    try {
        await apiCall(API_ENDPOINTS.REJECT_APPOINTMENT(appointmentId), {
            method: 'POST'
        });
        
        showSuccess('Appointment rejected');
        
        // Reload appointments
        await loadAppointments();
        
    } catch (error) {
        showError(error.message || 'Failed to reject appointment');
    } finally {
        hideLoading();
    }
}

// Verify appointment OTP
async function verifyAppointmentOTP(appointmentId) {
    const otp = prompt('Enter the 6-digit OTP provided by the patient:');
    
    if (!otp) return;
    
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP');
        return;
    }
    
    showLoading();
    
    try {
        await apiCall(`/api/appointments/${appointmentId}/verify-otp`, {
            method: 'POST',
            body: JSON.stringify({ otp: otp })
        });
        
        showSuccess('OTP verified successfully! You can now add prescription.');
        
        // Reload appointments
        await loadAppointments();
        
    } catch (error) {
        showError(error.message || 'Invalid OTP');
    } finally {
        hideLoading();
    }
}

// Show prescription form
function showPrescriptionForm(appointmentId, patientName) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; padding: 20px;';
    modal.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 12px; padding: 30px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px 0; color: var(--text-primary);">
                <i class="fas fa-prescription"></i> Add Prescription for ${patientName}
            </h3>
            
            <form id="prescriptionForm">
                <div class="form-group">
                    <label><i class="fas fa-stethoscope"></i> Diagnosis *</label>
                    <textarea id="diagnosis" required rows="3" placeholder="Enter diagnosis" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem;"></textarea>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-pills"></i> Medications *</label>
                    <div id="medicationsList" style="margin-bottom: 10px;"></div>
                    <button type="button" class="btn btn-secondary" onclick="addMedicationField()" style="width: 100%;">
                        <i class="fas fa-plus"></i> Add Medication
                    </button>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-notes-medical"></i> Instructions</label>
                    <textarea id="instructions" rows="3" placeholder="Special instructions for the patient" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem;"></textarea>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-calendar-check"></i> Next Checkup Date</label>
                    <input type="date" id="nextCheckup" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-save"></i> Save Prescription
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('div[style*=fixed]').remove()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add initial medication field
    addMedicationField();
    
    // Handle form submission
    document.getElementById('prescriptionForm').onsubmit = async (e) => {
        e.preventDefault();
        await submitPrescription(appointmentId);
        modal.remove();
    };
}

// Add medication input field
function addMedicationField() {
    const container = document.getElementById('medicationsList');
    const fieldId = 'med_' + Date.now();
    
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;';
    div.innerHTML = `
        <input type="text" id="${fieldId}" placeholder="Medicine name, dosage, frequency" 
               style="flex: 1; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem;" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()" style="padding: 10px 15px;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(div);
}

// Submit prescription
async function submitPrescription(appointmentId) {
    showLoading();
    
    try {
        const diagnosis = document.getElementById('diagnosis').value;
        const instructions = document.getElementById('instructions').value;
        const nextCheckup = document.getElementById('nextCheckup').value;
        
        // Collect all medications
        const medications = [];
        document.querySelectorAll('#medicationsList input').forEach(input => {
            if (input.value.trim()) {
                medications.push(input.value.trim());
            }
        });
        
        if (medications.length === 0) {
            showError('Please add at least one medication');
            hideLoading();
            return;
        }
        
        await apiCall(`/api/appointments/${appointmentId}/prescription`, {
            method: 'POST',
            body: JSON.stringify({
                diagnosis,
                medications,
                instructions,
                next_checkup: nextCheckup
            })
        });
        
        showSuccess('Prescription added successfully and uploaded to patient records!');
        
        // Reload appointments
        await loadAppointments();
        
    } catch (error) {
        showError(error.message || 'Failed to add prescription');
    } finally {
        hideLoading();
    }
}

// View prescription
function viewPrescription(appointmentId) {
    const appointment = myAppointments.find(apt => apt._id === appointmentId);
    
    if (!appointment || !appointment.prescription) {
        showError('Prescription not found');
        return;
    }
    
    const presc = appointment.prescription;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;';
    modal.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 12px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px 0; color: var(--text-primary);">
                <i class="fas fa-prescription"></i> Prescription Details
            </h3>
            
            <div style="margin-bottom: 15px;">
                <strong>Patient:</strong> ${appointment.patient?.full_name || 'N/A'}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Diagnosis:</strong><br>
                <div style="padding: 10px; background: var(--bg-secondary); border-radius: 6px; margin-top: 5px;">
                    ${presc.diagnosis}
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Medications:</strong><br>
                <ul style="margin: 5px 0 0 20px;">
                    ${presc.medications.map(med => `<li>${med}</li>`).join('')}
                </ul>
            </div>
            
            ${presc.instructions ? `
            <div style="margin-bottom: 15px;">
                <strong>Instructions:</strong><br>
                <div style="padding: 10px; background: var(--bg-secondary); border-radius: 6px; margin-top: 5px;">
                    ${presc.instructions}
                </div>
            </div>
            ` : ''}
            
            ${presc.next_checkup ? `
            <div style="margin-bottom: 15px;">
                <strong>Next Checkup:</strong> ${presc.next_checkup}
            </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-secondary);">
                Prescribed on ${new Date(presc.prescribed_at).toLocaleString('en-IN')}
            </div>
            
            <button class="btn btn-secondary" onclick="this.closest('div[style*=fixed]').remove()" style="width: 100%; margin-top: 20px;">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Delete appointment from history (doctor)
async function deleteAppointmentDoctor(appointmentId) {
    if (!confirm('Are you sure you want to delete this appointment from your history? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    try {
        await apiCall(`/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
        
        showSuccess('Appointment deleted from history');
        
        // Reload appointments
        await loadAppointments();
        
    } catch (error) {
        showError(error.message || 'Failed to delete appointment');
    } finally {
        hideLoading();
    }
}

// Load doctor card
let doctorCardData = null;

async function loadDoctorCard() {
    try {
        const response = await apiCall(API_ENDPOINTS.DOCTOR_CARD);
        doctorCardData = response.doctor_card;
        displayDoctorCard(doctorCardData);
    } catch (error) {
        console.error('Failed to load doctor card:', error);
    }
}

// Display doctor card
function displayDoctorCard(card) {
    // Update front card
    document.getElementById('cardDoctorName').textContent = `Dr. ${card.full_name}`;
    document.getElementById('cardDoctorId').textContent = card.doctor_id;
    document.getElementById('cardNmcUid').textContent = card.nmc_uid;
    document.getElementById('cardSpecialization').textContent = card.specialization;
    document.getElementById('cardExperience').textContent = `${card.years_of_experience} years`;
    document.getElementById('cardMemberSince').textContent = formatDate(card.member_since);
    
    // Update back card
    document.getElementById('cardBackQualification').textContent = card.qualification;
    document.getElementById('cardBackHospital').textContent = card.hospital_affiliation;
    document.getElementById('cardBackBloodGroup').textContent = card.blood_group;
    document.getElementById('cardBackLanguages').textContent = card.languages_spoken.join(', ') || 'Not specified';
    document.getElementById('cardBackEmail').textContent = card.email;
    document.getElementById('cardBackPhone').textContent = card.phone;
    
    // Generate QR Code
    const qrContainer = document.getElementById('doctorQRCode');
    qrContainer.innerHTML = ''; // Clear existing QR code
    new QRCode(qrContainer, {
        text: card.qr_data,
        width: 70,
        height: 70,
        colorDark: "#667eea",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Download doctor card
function downloadDoctorCard() {
    if (!doctorCardData) {
        showError('Doctor card data not loaded');
        return;
    }
    
    showLoading();
    
    // Load html2canvas from CDN if not already loaded
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => captureDoctorCard();
        script.onerror = () => {
            hideLoading();
            showError('Failed to load download library. Please try print option instead.');
        };
        document.head.appendChild(script);
    } else {
        captureDoctorCard();
    }
}

async function captureDoctorCard() {
    try {
        const cardFront = document.getElementById('cardFront');
        const cardBack = document.getElementById('cardBack');
        
        if (!cardFront || !cardBack) {
            throw new Error('Card not found');
        }
        
        // Create a container for both cards side by side
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '40px';
        container.style.padding = '40px';
        container.style.background = 'white';
        container.style.width = 'fit-content';
        
        // Clone the cards
        const frontClone = cardFront.cloneNode(true);
        const backClone = cardBack.cloneNode(true);
        
        // Set explicit dimensions
        frontClone.style.width = '856px';
        frontClone.style.height = '540px';
        backClone.style.width = '856px';
        backClone.style.height = '540px';
        
        container.appendChild(frontClone);
        container.appendChild(backClone);
        
        // Temporarily add to document
        document.body.appendChild(container);
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        
        // Capture with html2canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        // Remove temporary container
        document.body.removeChild(container);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BharathMedicare_DoctorCard_${doctorCardData.doctor_id}_${new Date().getTime()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            hideLoading();
            showSuccess('Doctor card downloaded successfully!');
        }, 'image/png');
        
    } catch (error) {
        console.error('Download error:', error);
        hideLoading();
        showError('Failed to download doctor card. Please try print option instead.');
    }
}

// Print doctor card (both sides)
function printDoctorCard() {
    if (!doctorCardData) {
        showError('Doctor card data not loaded');
        return;
    }
    
    const qrData = encodeURIComponent(`BHARATH_MEDICARE_DOCTOR|${doctorCardData.doctor_id}|${doctorCardData.full_name}|${doctorCardData.nmc_uid}`);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}&color=667eea&bgcolor=ffffff&qzone=1`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Doctor ID Card - ${doctorCardData.full_name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"/>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                
                body {
                    font-family: 'Poppins', sans-serif;
                    padding: 15mm;
                    background: #ffffff;
                }
                
                .card-container {
                    display: flex;
                    gap: 15mm;
                    justify-content: center;
                    align-items: flex-start;
                }
                
                .doctor-card {
                    width: 85.6mm;
                    height: 54mm;
                    border-radius: 12px;
                    padding: 14px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .card-front {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                .card-back {
                    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                }
                
                .card-bg-pattern {
                    position: absolute;
                    top: -30%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    border-radius: 50%;
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    position: relative;
                    z-index: 2;
                }
                
                .logo-section {
                    flex: 1;
                }
                
                .logo-title {
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 1px;
                    line-height: 1.2;
                }
                
                .logo-subtitle {
                    font-size: 6px;
                    opacity: 0.9;
                    line-height: 1.2;
                }
                
                .qr-section {
                    background: white;
                    padding: 4px;
                    border-radius: 6px;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .qr-section img {
                    width: 100%;
                    height: 100%;
                }
                
                .card-body {
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 8px;
                    padding: 10px;
                    position: relative;
                    z-index: 2;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    margin: 8px 0;
                }
                
                .doctor-name {
                    font-size: 15px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.2;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                
                .info-label {
                    font-size: 6px;
                    opacity: 0.8;
                    line-height: 1;
                }
                
                .info-value {
                    font-size: 8px;
                    font-weight: 600;
                    line-height: 1.2;
                    margin-top: 2px;
                }
                
                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                }
                
                .member-since {
                    font-size: 6px;
                    opacity: 0.8;
                    line-height: 1;
                }
                
                .member-date {
                    font-size: 7px;
                    font-weight: 600;
                    line-height: 1.2;
                    margin-top: 2px;
                }
                
                .verified-badge {
                    background: rgba(255,255,255,0.3);
                    padding: 3px 7px;
                    border-radius: 12px;
                    font-size: 6px;
                    font-weight: 700;
                    white-space: nowrap;
                }
                
                .back-title {
                    text-align: center;
                    position: relative;
                    z-index: 2;
                }
                
                .back-title h2 {
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 2px;
                    line-height: 1.2;
                }
                
                .back-title p {
                    font-size: 6px;
                    opacity: 0.9;
                    line-height: 1.2;
                }
                
                .back-info {
                    margin-bottom: 0;
                }
                
                .back-body {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;
                }
                
                .back-footer {
                    text-align: center;
                    padding-top: 6px;
                    border-top: 1px solid rgba(255,255,255,0.3);
                    position: relative;
                    z-index: 2;
                }
                
                .back-footer p {
                    font-size: 6px;
                    opacity: 0.8;
                    line-height: 1.2;
                }
                
                @media print {
                    body {
                        padding: 10mm;
                    }
                    
                    .card-container {
                        gap: 10mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <!-- Front Card -->
                <div class="doctor-card card-front">
                    <div class="card-bg-pattern"></div>
                    
                    <div class="card-header">
                        <div class="logo-section">
                            <div class="logo-title">BharathMedicare</div>
                            <div class="logo-subtitle">National Medical Council Registered</div>
                        </div>
                        <div class="qr-section">
                            <img src="${qrImageUrl}" alt="QR Code">
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="doctor-name">Dr. ${doctorCardData.full_name}</div>
                        
                        <div class="info-row">
                            <div>
                                <div class="info-label">Doctor ID</div>
                                <div class="info-value">${doctorCardData.doctor_id}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="info-label">NMC UID</div>
                                <div class="info-value">${doctorCardData.nmc_uid}</div>
                            </div>
                        </div>
                        
                        <div class="info-row">
                            <div>
                                <div class="info-label">Specialization</div>
                                <div class="info-value">${doctorCardData.specialization}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="info-label">Experience</div>
                                <div class="info-value">${doctorCardData.years_of_experience} years</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <div>
                            <div class="member-since">Member Since</div>
                            <div class="member-date">${formatDate(doctorCardData.member_since)}</div>
                        </div>
                        <div class="verified-badge">
                            <i class="fas fa-check-circle"></i> VERIFIED
                        </div>
                    </div>
                </div>
                
                <!-- Back Card -->
                <div class="doctor-card card-back">
                    <div class="card-bg-pattern"></div>
                    
                    <div class="back-title">
                        <h2>Professional Details</h2>
                        <p>Medical Practitioner Information</p>
                    </div>
                    
                    <div class="card-body back-body">
                        <div class="back-info">
                            <div class="info-label">QUALIFICATION</div>
                            <div class="info-value">${doctorCardData.qualification}</div>
                        </div>
                        
                        <div class="back-info">
                            <div class="info-label">HOSPITAL AFFILIATION</div>
                            <div class="info-value" style="font-size: 7px;">${doctorCardData.hospital_affiliation}</div>
                        </div>
                        
                        <div class="back-info">
                            <div class="info-label">BLOOD GROUP</div>
                            <div class="info-value">${doctorCardData.blood_group}</div>
                        </div>
                        
                        <div class="back-info">
                            <div class="info-label">LANGUAGES SPOKEN</div>
                            <div class="info-value" style="font-size: 7px;">${doctorCardData.languages_spoken.join(', ')}</div>
                        </div>
                        
                        <div class="back-info">
                            <div class="info-label">CONTACT</div>
                            <div class="info-value" style="font-size: 6px;">${doctorCardData.email}</div>
                            <div class="info-value" style="font-size: 6px;">${doctorCardData.phone}</div>
                        </div>
                    </div>
                    
                    <div class="back-footer">
                        <p>For emergencies, please call the hospital directly</p>
                    </div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Show section
function showSection(section) {
    // Hide all sections
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('appointmentsSection').style.display = 'none';
    document.getElementById('patientsSection').style.display = 'none';
    document.getElementById('doctorCardSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section and set active menu item
    switch(section) {
        case 'dashboard':
            document.getElementById('dashboardSection').style.display = 'block';
            document.querySelector('.sidebar-menu-link[onclick*="dashboard"]').classList.add('active');
            break;
        case 'appointments':
            document.getElementById('appointmentsSection').style.display = 'block';
            document.querySelector('.sidebar-menu-link[onclick*="appointments"]').classList.add('active');
            break;
        case 'patients':
            document.getElementById('patientsSection').style.display = 'block';
            document.querySelector('.sidebar-menu-link[onclick*="patients"]').classList.add('active');
            break;
        case 'doctorCard':
            document.getElementById('doctorCardSection').style.display = 'block';
            document.querySelector('.sidebar-menu-link[onclick*="doctorCard"]').classList.add('active');
            break;
        case 'profile':
            document.getElementById('profileSection').style.display = 'block';
            document.querySelector('.sidebar-menu-link[onclick*="profile"]').classList.add('active');
            break;
    }
}


// Copy to clipboard utility
function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccess(successMessage);
        }).catch(() => {
            fallbackCopyToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyToClipboard(text, successMessage);
    }
}

function fallbackCopyToClipboard(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showSuccess(successMessage);
    } catch (err) {
        showError('Failed to copy');
    }
    document.body.removeChild(textArea);
}

// Clear RFID field for doctor (only works if not yet linked)
function clearDoctorRfidField() {
    const user = getUserData();
    if (!user.rfid_id) {
        document.getElementById('profileRfidId').value = '';
        showSuccess('RFID field cleared');
    } else {
        showError('RFID is locked. Contact admin to modify.');
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
