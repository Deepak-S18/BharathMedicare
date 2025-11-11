// Hospital Patient View JavaScript

let patientRecords = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we have a valid session
    if (!requireAuth()) {
        window.location.href = 'hospital-portal.html';
        return;
    }
    
    const user = getUserData();
    
    // Only allow patients to be viewed (hospital scanned them)
    if (user.role !== 'patient') {
        showError('Invalid access. Please scan a patient QR code.');
        setTimeout(() => {
            window.location.href = 'hospital-portal.html';
        }, 2000);
        return;
    }
    
    // Load patient data
    await loadPatientData();
});

// Load patient information and records
async function loadPatientData() {
    showLoading();
    
    try {
        // Load patient profile
        const profileResponse = await apiCall(API_ENDPOINTS.CURRENT_USER);
        const patient = profileResponse.user;
        
        if (patient) {
            displayPatientInfo(patient);
            displayMedicalInfo(patient);
        }
        
        // Load patient records
        const recordsResponse = await apiCall(API_ENDPOINTS.MY_RECORDS);
        patientRecords = recordsResponse.records || [];
        displayRecords();
        
    } catch (error) {
        showError('Failed to load patient data');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Display patient basic information
function displayPatientInfo(patient) {
    // Overview section
    document.getElementById('patientName').textContent = patient.full_name || 'N/A';
    document.getElementById('patientId').textContent = patient.patient_id || 'N/A';
    document.getElementById('patientEmail').textContent = patient.email || 'N/A';
    document.getElementById('patientPhone').textContent = patient.phone || 'N/A';
    document.getElementById('patientGender').textContent = patient.gender || 'Not specified';
    
    // Personal section (duplicate)
    document.getElementById('patientName2').textContent = patient.full_name || 'N/A';
    document.getElementById('patientId2').textContent = patient.patient_id || 'N/A';
    document.getElementById('patientEmail2').textContent = patient.email || 'N/A';
    document.getElementById('patientPhone2').textContent = patient.phone || 'N/A';
    document.getElementById('patientGender2').textContent = patient.gender || 'Not specified';
    document.getElementById('patientAddress').textContent = patient.address || 'Not specified';
    
    // Format date of birth
    if (patient.date_of_birth) {
        const dob = new Date(patient.date_of_birth);
        const age = calculateAge(dob);
        const dobText = `${dob.toLocaleDateString('en-IN')} (${age} years)`;
        document.getElementById('patientDob').textContent = dobText;
        document.getElementById('patientDob2').textContent = dobText;
    } else {
        document.getElementById('patientDob').textContent = 'Not specified';
        document.getElementById('patientDob2').textContent = 'Not specified';
    }
}

// Display medical information
function displayMedicalInfo(patient) {
    document.getElementById('bloodGroup').textContent = patient.blood_group || 'Not specified';
    document.getElementById('height').textContent = patient.height ? `${patient.height} cm` : 'Not specified';
    document.getElementById('weight').textContent = patient.weight ? `${patient.weight} kg` : 'Not specified';
    
    // Emergency contact
    if (patient.emergency_contact_name && patient.emergency_contact) {
        document.getElementById('emergencyContact').textContent = 
            `${patient.emergency_contact_name} (${patient.emergency_contact})`;
    } else {
        document.getElementById('emergencyContact').textContent = 'Not specified';
    }
    
    // Allergies
    if (patient.allergies && patient.allergies.length > 0) {
        document.getElementById('allergiesList').innerHTML = 
            patient.allergies.map(allergy => `<div class="list-item">${allergy}</div>`).join('');
    } else {
        document.getElementById('allergiesList').textContent = 'None reported';
    }
    
    // Chronic conditions
    if (patient.chronic_conditions && patient.chronic_conditions.length > 0) {
        document.getElementById('conditionsList').innerHTML = 
            patient.chronic_conditions.map(condition => `<div class="list-item">${condition}</div>`).join('');
    } else {
        document.getElementById('conditionsList').textContent = 'None reported';
    }
    
    // Current medications
    if (patient.current_medications && patient.current_medications.length > 0) {
        document.getElementById('medicationsList').innerHTML = 
            patient.current_medications.map(medication => `<div class="list-item">${medication}</div>`).join('');
    } else {
        document.getElementById('medicationsList').textContent = 'None reported';
    }
}

// Display medical records
function displayRecords() {
    const container = document.getElementById('recordsContainer');
    
    console.log('Displaying records:', patientRecords);
    
    if (!patientRecords || patientRecords.length === 0) {
        container.innerHTML = `
            <div class="no-records">
                <i class="fas fa-file-medical"></i>
                <p>No medical records found for this patient</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = patientRecords.map(record => {
        console.log('Record data:', record);
        const uploadDate = new Date(record.uploaded_at);
        const fileIcon = getFileIcon(record.file_type);
        
        return `
            <div class="record-card">
                <div class="record-icon">
                    <i class="fas ${fileIcon}"></i>
                </div>
                <div class="record-details">
                    <h3>${record.description || 'Medical Record'}</h3>
                    <p>
                        <i class="fas fa-calendar"></i> ${uploadDate.toLocaleDateString('en-IN')} 
                        <i class="fas fa-clock" style="margin-left: 15px;"></i> ${uploadDate.toLocaleTimeString('en-IN')}
                    </p>
                    <p style="margin-top: 5px;">
                        <i class="fas fa-file"></i> ${record.file_type.toUpperCase()} 
                        ${record.file_size ? `• ${formatFileSize(record.file_size)}` : ''}
                    </p>
                </div>
                <div class="record-actions">
                    <button class="action-btn btn-view" onclick="viewRecord('${record._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn btn-download" onclick="downloadRecord('${record._id}', '${record.description || 'record'}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// View record
async function viewRecord(recordId) {
    console.log('View record called with ID:', recordId);
    showLoading();
    
    try {
        // Use DOWNLOAD_RECORD endpoint to get the actual file
        const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_RECORD(recordId)}`;
        const token = getAuthToken();
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch record');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        
        // Clean up after a delay to allow the browser to load the file
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        
    } catch (error) {
        showError('Failed to view record');
        console.error('View record error:', error);
    } finally {
        hideLoading();
    }
}

// Download record
async function downloadRecord(recordId, description) {
    console.log('Download record called with ID:', recordId, 'Description:', description);
    showLoading();
    
    try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_RECORD(recordId)}`;
        const token = getAuthToken();
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${description}_${recordId}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        showSuccess('Record downloaded successfully');
        
    } catch (error) {
        showError('Failed to download record');
        console.error('Download record error:', error);
    } finally {
        hideLoading();
    }
}

// Get file icon based on file type
function getFileIcon(fileType) {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return 'fa-file-pdf';
    if (type === 'jpg' || type === 'jpeg' || type === 'png') return 'fa-file-image';
    return 'fa-file';
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Calculate age from date of birth
function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Go back to scanner
function goBack() {
    // Clear hospital access flag
    localStorage.removeItem('hospital_access');
    
    // Clear session
    logout();
    
    // Redirect to hospital portal
    window.location.href = 'hospital-portal.html';
}

// Show loading spinner
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
    alert(message);
}

// Show content section
function showContentSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const sectionMap = {
        'overview': 'overviewSection',
        'personal': 'personalSection',
        'medical': 'medicalSection',
        'records': 'recordsSection'
    };
    
    const sectionId = sectionMap[sectionName];
    if (sectionId) {
        document.getElementById(sectionId).classList.add('active');
    }
    
    // Set active nav item
    event.currentTarget.classList.add('active');
    
    // Close mobile menu if open
    if (window.innerWidth <= 768) {
        document.getElementById('hospitalSidebar').classList.remove('mobile-open');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.getElementById('hospitalSidebar');
    sidebar.classList.toggle('mobile-open');
}
