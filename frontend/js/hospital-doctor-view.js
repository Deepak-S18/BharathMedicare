// Hospital Doctor View - Read-only doctor information display

let doctorData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if this is a hospital access session
    const isHospitalAccess = localStorage.getItem('hospital_access') === 'true';
    
    if (!isHospitalAccess) {
        showError('Unauthorized access. Please scan QR code or RFID card at hospital portal.');
        setTimeout(() => {
            window.location.href = 'hospital-portal.html';
        }, 2000);
        return;
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
        showError('Session expired. Please scan again.');
        setTimeout(() => {
            window.location.href = 'hospital-portal.html';
        }, 2000);
        return;
    }

    const user = getUserData();
    
    // Verify this is a doctor
    if (user.role !== 'doctor') {
        showError('This view is only for doctors.');
        setTimeout(() => {
            window.location.href = 'hospital-portal.html';
        }, 2000);
        return;
    }

    await loadDoctorData();
});

// Load doctor data
async function loadDoctorData() {
    showLoading();
    
    try {
        // Load doctor profile
        const profileResponse = await apiCall(API_ENDPOINTS.CURRENT_USER);
        const doctor = profileResponse.user;
        
        if (doctor) {
            doctorData = doctor;
            displayDoctorInfo(doctor);
        }
        
    } catch (error) {
        showError('Failed to load doctor data');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Display doctor information
function displayDoctorInfo(doctor) {
    // Sidebar
    document.getElementById('sidebarDoctorName').textContent = `Dr. ${doctor.full_name}`;
    document.getElementById('sidebarDoctorId').textContent = doctor.doctor_id || 'N/A';
    
    // Doctor ID Card - Front
    document.getElementById('cardDoctorName').textContent = `Dr. ${doctor.full_name}`;
    document.getElementById('cardDoctorId').textContent = doctor.doctor_id || 'N/A';
    document.getElementById('cardNmcUid').textContent = doctor.nmc_uid || 'N/A';
    document.getElementById('cardSpecialization').textContent = doctor.specialization || 'Not specified';
    document.getElementById('cardExperience').textContent = doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'N/A';
    document.getElementById('cardMemberSince').textContent = formatDate(doctor.created_at);
    
    // Doctor ID Card - Back
    document.getElementById('cardBackQualification').textContent = doctor.qualification || 'Not specified';
    document.getElementById('cardBackHospital').textContent = doctor.hospital_affiliation || 'Not specified';
    document.getElementById('cardBackBloodGroup').textContent = doctor.blood_group || 'Not specified';
    document.getElementById('cardBackLanguages').textContent = 
        (doctor.languages_spoken && doctor.languages_spoken.length > 0) 
            ? doctor.languages_spoken.join(', ') 
            : 'Not specified';
    document.getElementById('cardBackEmail').textContent = doctor.email;
    document.getElementById('cardBackPhone').textContent = doctor.phone || 'Not provided';
    
    // Professional Information
    document.getElementById('infoSpecialization').textContent = doctor.specialization || 'Not specified';
    document.getElementById('infoExperience').textContent = doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'Not specified';
    document.getElementById('infoQualification').textContent = doctor.qualification || 'Not specified';
    document.getElementById('infoHospital').textContent = doctor.hospital_affiliation || 'Not specified';
    
    // Contact Information
    document.getElementById('infoEmail').textContent = doctor.email;
    document.getElementById('infoPhone').textContent = doctor.phone || 'Not provided';
    document.getElementById('infoBloodGroup').textContent = doctor.blood_group || 'Not specified';
    document.getElementById('infoLanguages').textContent = 
        (doctor.languages_spoken && doctor.languages_spoken.length > 0) 
            ? doctor.languages_spoken.join(', ') 
            : 'Not specified';
    
    // Generate QR Code if available
    if (doctor.doctor_id) {
        generateDoctorQRCode(doctor);
    }
}

// Generate QR code for doctor
function generateDoctorQRCode(doctor) {
    const container = document.getElementById('doctorQRCode');
    if (!container) return;
    
    container.innerHTML = '';
    
    const qrData = `BHARATH_DOCTOR|${doctor.doctor_id}|${doctor.full_name}|${doctor.email}`;
    
    try {
        const encodedData = encodeURIComponent(qrData);
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodedData}&color=667eea&bgcolor=ffffff&qzone=1`;
        
        const img = document.createElement('img');
        img.src = qrImageUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.alt = 'Doctor QR Code';
        
        img.onerror = function() {
            container.innerHTML = '<i class="fas fa-qrcode" style="font-size: 2rem; color: #667eea;"></i>';
        };
        
        container.appendChild(img);
        
    } catch (error) {
        console.error('QR Code error:', error);
        container.innerHTML = '<i class="fas fa-qrcode" style="font-size: 2rem; color: #667eea;"></i>';
    }
}

// Exit view and return to hospital portal
function exitView() {
    if (confirmAction('Exit doctor view and return to hospital portal?')) {
        // Clear hospital session
        localStorage.removeItem('hospital_access');
        removeAuthToken();
        removeUserData();
        
        // Redirect to hospital portal
        window.location.href = 'hospital-portal.html';
    }
}

// Handle logout
function handleLogout() {
    exitView();
}
