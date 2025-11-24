let html5QrCode;

function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR Code scanned: ${decodedText}`);
    
    // Parse QR data: BHARATH|{patient_id}|{full_name}|{email}
    const parts = decodedText.split('|');
    
    if (parts.length >= 4 && parts[0] === 'BHARATH') {
        const patientId = parts[1];
        const fullName = parts[2];
        const email = parts[3];
        
        updateStatus(`Patient detected: ${fullName}`, 'success');
        
        // Stop scanning
        html5QrCode.stop().then(() => {
            console.log('Scanner stopped');
        }).catch(err => {
            console.error('Failed to stop scanner:', err);
        });
        
        // Login patient automatically
        loginPatient(patientId, email);
        
    } else {
        updateStatus('Invalid QR code format', 'error');
    }
}

function onScanError(errorMessage) {
    // Ignore frequent scan errors
    console.debug(`QR Scan error: ${errorMessage}`);
}

function updateStatus(message, type) {
    // Try RFID status first (for RFID operations)
    const rfidStatusText = document.getElementById('rfidStatusText');
    const rfidStatus = document.getElementById('rfidStatus');
    
    if (rfidStatusText && rfidStatus) {
        rfidStatusText.textContent = message;
        rfidStatus.style.display = 'block';
        
        // Update colors based on type
        const statusDiv = rfidStatus.querySelector('div');
        if (type === 'success') {
            statusDiv.style.background = '#e8f5e9';
            statusDiv.style.color = '#388e3c';
        } else if (type === 'error') {
            statusDiv.style.background = '#ffebee';
            statusDiv.style.color = '#d32f2f';
        } else {
            statusDiv.style.background = '#e3f2fd';
            statusDiv.style.color = '#1976d2';
        }
    }
}

async function loginPatient(patientId, email) {
    try {
        updateStatus('Logging in patient...', 'waiting');
        
        console.log('Attempting login with:', { patientId, email });
        console.log('API URL:', `${API_BASE_URL}/api/auth/hospital-login`);
        
        // Create a hospital session token for this patient
        const response = await fetch(`${API_BASE_URL}/api/auth/hospital-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patient_id: patientId,
                email: email
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.token) {
            // Store token and user data using proper storage keys
            setAuthToken(data.token);
            setUserData(data.user);
            
            // Mark this as a hospital access session
            localStorage.setItem('hospital_access', 'true');
            
            updateStatus(`Patient ${data.user.full_name} loaded! Redirecting...`, 'success');
            
            // Redirect to hospital patient view (not full dashboard)
            setTimeout(() => {
                window.location.href = 'hospital-patient-view.html';
            }, 1500);
            
        } else {
            const errorMsg = data.error || 'Login failed';
            console.error('Login failed:', errorMsg);
            updateStatus(errorMsg, 'error');
            // Restart scanner after 3 seconds
            setTimeout(startScanner, 3000);
        }
        
    } catch (error) {
        console.error('Login error details:', error);
        updateStatus(`Connection error: ${error.message}. Check console for details.`, 'error');
        setTimeout(startScanner, 3000);
    }
}

async function loginManually() {
    const patientId = document.getElementById('manualPatientId').value.trim();
    
    if (!patientId) {
        updateStatus('Please enter a patient ID', 'error');
        return;
    }
    
    try {
        updateStatus('Looking up patient...', 'waiting');
        
        // Get patient by ID
        const response = await fetch(`${API_BASE_URL}/api/auth/hospital-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patient_id: patientId
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            setAuthToken(data.token);
            setUserData(data.user);
            
            // Mark this as a hospital access session
            localStorage.setItem('hospital_access', 'true');
            
            updateStatus(`Patient ${data.user.full_name} loaded! Redirecting...`, 'success');
            
            setTimeout(() => {
                window.location.href = 'hospital-patient-view.html';
            }, 1500);
            
        } else {
            updateStatus(data.error || 'Patient not found', 'error');
        }
        
    } catch (error) {
        console.error('Manual login error:', error);
        updateStatus('Connection error. Please try again.', 'error');
    }
}

function startScanner() {
    // Show/hide buttons
    document.getElementById('startQRBtn').style.display = 'none';
    document.getElementById('stopQRBtn').style.display = 'block';
    document.getElementById('qr-reader').style.display = 'block';
    
    updateStatus('Scanning for QR code...', 'waiting');
    
    html5QrCode = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).catch(err => {
        console.error('Failed to start scanner:', err);
        updateStatus('Camera access denied or not available', 'error');
        // Reset buttons if camera fails
        document.getElementById('startQRBtn').style.display = 'block';
        document.getElementById('stopQRBtn').style.display = 'none';
        document.getElementById('qr-reader').style.display = 'none';
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log('Scanner stopped');
            // Reset buttons
            document.getElementById('startQRBtn').style.display = 'block';
            document.getElementById('stopQRBtn').style.display = 'none';
            document.getElementById('qr-reader').style.display = 'none';
            resetScanStatus();
        }).catch(err => {
            console.error('Failed to stop scanner:', err);
        });
    }
}

// ============================================
// RFID CARD HANDLING
// ============================================

// Simple RFID activation function
function activateRFIDScan() {
    const rfidStatus = document.getElementById('rfidStatus');
    const rfidStatusText = document.getElementById('rfidStatusText');
    const rfidCapture = document.getElementById('rfidCapture');
    
    // Show status and focus on capture input
    rfidStatus.style.display = 'block';
    rfidStatusText.textContent = 'RFID scanner activated. Scan your card now...';
    rfidCapture.focus();
    
    console.log('RFID scanner activated. Ready for card scan.');
    console.log('You can also manually type your RFID: 0013032911 and press Enter');
}

function initRFIDCapture() {
    const rfidCapture = document.getElementById('rfidCapture');
    
    if (!rfidCapture) return;
    
    let rfidBuffer = '';
    let rfidTimeout = null;
    
    // Listen for input on the hidden capture field
    rfidCapture.addEventListener('input', function() {
        clearTimeout(rfidTimeout);
        rfidBuffer = this.value.trim();
        
        // RFID readers typically send data quickly
        // Wait a short time to ensure we have the full ID
        rfidTimeout = setTimeout(async () => {
            if (rfidBuffer.length >= 8) { // RFID IDs are typically 10+ characters
                await handleRFIDLogin(rfidBuffer);
                rfidBuffer = '';
                this.value = '';
            }
        }, 100);
    });
    
    // Also listen for Enter key
    rfidCapture.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            clearTimeout(rfidTimeout);
            const rfidId = this.value.trim();
            if (rfidId.length >= 8) {
                await handleRFIDLogin(rfidId);
            }
            this.value = '';
            rfidBuffer = '';
        }
    });
}

async function handleRFIDLogin(rfidId) {
    console.log('RFID Login attempt with ID:', rfidId);
    
    updateStatus(`RFID detected: ${rfidId}. Verifying...`, 'waiting');
    
    try {
        // Login using RFID
        const response = await fetch(`${API_BASE_URL}/api/auth/rfid-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rfid_id: rfidId })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            // Success - set authentication data
            localStorage.setItem('bharath_medicare_token', data.token);
            localStorage.setItem('bharath_medicare_user', JSON.stringify(data.user));
            localStorage.setItem('hospital_access', 'true');
            
            updateStatus(`Welcome ${data.user.full_name}! Redirecting...`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'patient') {
                    window.location.href = 'hospital-patient-view.html';
                } else if (data.user.role === 'doctor') {
                    window.location.href = 'hospital-doctor-view.html';
                } else {
                    window.location.href = 'hospital-patient-view.html';
                }
            }, 2000);
            
        } else {
            // Error - RFID not found
            updateStatus(data.error || 'RFID card not registered in system', 'error');
        }
        
    } catch (error) {
        console.error('RFID login error:', error);
        updateStatus('Connection error. Please try again.', 'error');
    }
}

// Simple reset function
function resetScanStatus() {
    const scanStatus = document.getElementById('scanStatus');
    if (scanStatus) {
        scanStatus.style.display = 'none';
    }
}

// Search by Patient/Doctor ID
async function searchById() {
    const manualId = document.getElementById('manualPatientId').value.trim();
    
    if (!manualId) {
        updateStatus('Please enter a Patient ID or Doctor ID', 'error');
        return;
    }
    
    updateStatus('Searching for ID: ' + manualId, 'waiting');
    
    try {
        // Call backend to search for the ID
        const response = await fetch(`${API_BASE_URL}/api/auth/search-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ search_id: manualId })
        });
        
        const data = await response.json();
        
        if (response.ok && data.user) {
            updateStatus(`Found: ${data.user.full_name}. Redirecting...`, 'success');
            
            // Set authentication data
            localStorage.setItem('bharath_medicare_token', data.token);
            localStorage.setItem('bharath_medicare_user', JSON.stringify(data.user));
            localStorage.setItem('hospital_access', 'true');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'patient') {
                    window.location.href = 'hospital-patient-view.html';
                } else if (data.user.role === 'doctor') {
                    window.location.href = 'hospital-doctor-view.html';
                } else {
                    window.location.href = 'hospital-patient-view.html';
                }
            }, 1500);
            
        } else {
            updateStatus(data.error || 'ID not found in system', 'error');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        updateStatus('Connection error. Please try again.', 'error');
    }
}

// Admin RFID activation function
function activateAdminRFIDScan() {
    const adminRfidStatus = document.getElementById('adminRfidStatus');
    const adminRfidStatusText = document.getElementById('adminRfidStatusText');
    const adminRfidCapture = document.getElementById('adminRfidCapture');
    
    // Show status and focus on capture input
    adminRfidStatus.style.display = 'block';
    adminRfidStatusText.textContent = 'Admin RFID scanner activated. Scan your admin card now...';
    adminRfidCapture.focus();
    
    console.log('Admin RFID scanner activated. Ready for admin card scan.');
}

function initAdminRFIDCapture() {
    const adminRfidCapture = document.getElementById('adminRfidCapture');
    
    if (!adminRfidCapture) return;
    
    let rfidBuffer = '';
    let rfidTimeout = null;
    
    // Listen for input on the hidden admin capture field
    adminRfidCapture.addEventListener('input', function() {
        clearTimeout(rfidTimeout);
        rfidBuffer = this.value.trim();
        
        // RFID readers typically send data quickly
        rfidTimeout = setTimeout(async () => {
            if (rfidBuffer.length >= 8) {
                await handleAdminRFIDLogin(rfidBuffer);
                rfidBuffer = '';
                this.value = '';
            }
        }, 100);
    });
    
    // Also listen for Enter key
    adminRfidCapture.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            clearTimeout(rfidTimeout);
            const rfidId = this.value.trim();
            if (rfidId.length >= 8) {
                await handleAdminRFIDLogin(rfidId);
            }
            this.value = '';
            rfidBuffer = '';
        }
    });
}

async function handleAdminRFIDLogin(rfidId) {
    console.log('Admin RFID Login attempt with ID:', rfidId);
    
    const adminRfidStatusText = document.getElementById('adminRfidStatusText');
    const adminRfidStatus = document.getElementById('adminRfidStatus');
    
    if (adminRfidStatusText) {
        adminRfidStatusText.textContent = `Admin RFID detected: ${rfidId}. Verifying...`;
    }
    
    try {
        // Login using RFID
        const response = await fetch(`${API_BASE_URL}/api/auth/rfid-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rfid_id: rfidId })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            // Check if user is admin
            if (data.user.role === 'admin') {
                // Store token and user data
                setAuthToken(data.token);
                setUserData(data.user);
                
                if (adminRfidStatusText) {
                    adminRfidStatusText.textContent = `Admin ${data.user.full_name} verified! Redirecting to dashboard...`;
                }
                
                // Redirect to admin dashboard with full access
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
                
            } else {
                // Not an admin - show error
                if (adminRfidStatusText) {
                    adminRfidStatusText.textContent = `Access Denied: This card is not registered as an admin. Role: ${data.user.role}`;
                }
                console.error('RFID card is not an admin card. Role:', data.user.role);
            }
        } else {
            if (adminRfidStatusText) {
                adminRfidStatusText.textContent = data.error || 'Admin RFID not found in system';
            }
        }
        
    } catch (error) {
        console.error('Admin RFID login error:', error);
        if (adminRfidStatusText) {
            adminRfidStatusText.textContent = 'Connection error. Please try again.';
        }
    }
}

// Don't auto-start scanner on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Hospital portal loaded. Click "Click to Scan RFID" to begin.');
    
    // Initialize RFID capture for patients/doctors
    initRFIDCapture();
    
    // Initialize Admin RFID capture
    initAdminRFIDCapture();
});
