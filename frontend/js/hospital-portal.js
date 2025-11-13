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
    const statusEl = document.getElementById('scanner-status');
    statusEl.textContent = message;
    statusEl.className = `scanner-status status-${type}`;
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
    // Hide start button, show scanner and stop button
    document.getElementById('scanButtonContainer').style.display = 'none';
    document.getElementById('qr-reader').style.display = 'block';
    document.getElementById('scanner-status').style.display = 'block';
    document.getElementById('stopButtonContainer').style.display = 'block';
    
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
        // Show start button again if camera fails
        document.getElementById('scanButtonContainer').style.display = 'block';
        document.getElementById('qr-reader').style.display = 'none';
        document.getElementById('stopButtonContainer').style.display = 'none';
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log('Scanner stopped');
            // Show start button, hide scanner and stop button
            document.getElementById('scanButtonContainer').style.display = 'block';
            document.getElementById('qr-reader').style.display = 'none';
            document.getElementById('scanner-status').style.display = 'none';
            document.getElementById('stopButtonContainer').style.display = 'none';
        }).catch(err => {
            console.error('Failed to stop scanner:', err);
        });
    }
}

// ============================================
// RFID CARD HANDLING
// ============================================

function initRFIDCapture() {
    const rfidCapture = document.getElementById('rfidCapture');
    const rfidDisplay = document.getElementById('rfidInput');
    
    if (!rfidCapture || !rfidDisplay) return;
    
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
    
    // Keep focus on capture input periodically, but don't interfere with user input
    let rfidFocusInterval = setInterval(() => {
        const activeElement = document.activeElement;
        
        // Don't steal focus if user is typing in any input field or interacting with buttons
        const isUserInteracting = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'BUTTON' ||
            activeElement.tagName === 'SELECT'
        );
        
        // Only focus RFID capture if user is not actively using the form
        if (!isUserInteracting) {
            rfidCapture.focus();
        }
    }, 1000); // Reduced frequency to 1 second
    
    // Store interval ID so it can be cleared if needed
    rfidCapture.dataset.focusInterval = rfidFocusInterval;
}

async function handleRFIDLogin(rfidId) {
    const rfidDisplay = document.getElementById('rfidInput');
    const rfidStatusCard = document.getElementById('rfidStatusCard');
    const rfidStatusIcon = document.getElementById('rfidStatusIcon');
    const rfidStatusText = document.getElementById('rfidStatusText');
    const rfidStatusDetail = document.getElementById('rfidStatusDetail');
    const rfidVerificationProgress = document.getElementById('rfidVerificationProgress');
    const rfidVerificationStep = document.getElementById('rfidVerificationStep');
    const rfidSuccessMessage = document.getElementById('rfidSuccessMessage');
    const rfidSuccessName = document.getElementById('rfidSuccessName');
    const rfidErrorMessage = document.getElementById('rfidErrorMessage');
    const rfidErrorTitle = document.getElementById('rfidErrorTitle');
    const rfidErrorDetail = document.getElementById('rfidErrorDetail');
    
    if (!rfidDisplay) return;
    
    // Step 1: Show card detected
    rfidDisplay.value = rfidId;
    rfidStatusCard.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    rfidStatusIcon.className = 'fas fa-id-card';
    rfidStatusText.textContent = 'Card Detected';
    rfidStatusDetail.textContent = `ID: ${rfidId.substring(0, 8)}...`;
    
    // Hide previous messages
    rfidSuccessMessage.style.display = 'none';
    rfidErrorMessage.style.display = 'none';
    
    // Show verification progress
    rfidVerificationProgress.style.display = 'block';
    rfidVerificationStep.textContent = 'Connecting to server...';
    
    updateStatus('Authenticating RFID card...', 'waiting');
    
    try {
        // Step 2: Authenticating
        rfidVerificationStep.textContent = 'Verifying card credentials...';
        
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
            // Step 3: Success
            rfidVerificationStep.textContent = 'Loading user profile...';
            
            setAuthToken(data.token);
            setUserData(data.user);
            
            // Mark this as a hospital access session
            localStorage.setItem('hospital_access', 'true');
            
            // Update UI to success state
            rfidVerificationProgress.style.display = 'none';
            rfidSuccessMessage.style.display = 'block';
            rfidSuccessName.textContent = `Welcome, ${data.user.full_name}!`;
            
            rfidStatusCard.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            rfidStatusIcon.className = 'fas fa-check-circle';
            rfidStatusText.textContent = 'Access Granted';
            rfidStatusDetail.textContent = `${data.user.role === 'patient' ? 'Patient' : 'Doctor'} - ${data.user.email}`;
            
            rfidDisplay.value = `✓ ${data.user.full_name}`;
            updateStatus(`RFID authenticated! Welcome ${data.user.full_name}`, 'success');
            
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
            // Step 4: Error
            rfidVerificationProgress.style.display = 'none';
            rfidErrorMessage.style.display = 'block';
            rfidErrorTitle.textContent = 'Authentication Failed';
            rfidErrorDetail.textContent = data.error || 'This RFID card is not registered in the system';
            
            rfidStatusCard.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            rfidStatusIcon.className = 'fas fa-times-circle';
            rfidStatusText.textContent = 'Access Denied';
            rfidStatusDetail.textContent = 'Card not recognized';
            
            rfidDisplay.value = '';
            updateStatus(data.error || 'RFID card not recognized', 'error');
            
            // Reset after 4 seconds
            setTimeout(() => {
                resetRFIDUI();
            }, 4000);
        }
        
    } catch (error) {
        console.error('RFID login error:', error);
        
        // Network error
        rfidVerificationProgress.style.display = 'none';
        rfidErrorMessage.style.display = 'block';
        rfidErrorTitle.textContent = 'Connection Error';
        rfidErrorDetail.textContent = 'Unable to connect to server. Please check your connection.';
        
        rfidStatusCard.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        rfidStatusIcon.className = 'fas fa-exclamation-triangle';
        rfidStatusText.textContent = 'Connection Error';
        rfidStatusDetail.textContent = 'Please try again';
        
        rfidDisplay.value = '';
        updateStatus('Connection error. Please try again.', 'error');
        
        // Reset after 4 seconds
        setTimeout(() => {
            resetRFIDUI();
        }, 4000);
    }
}

function resetRFIDUI() {
    const rfidDisplay = document.getElementById('rfidInput');
    const rfidStatusCard = document.getElementById('rfidStatusCard');
    const rfidStatusIcon = document.getElementById('rfidStatusIcon');
    const rfidStatusText = document.getElementById('rfidStatusText');
    const rfidStatusDetail = document.getElementById('rfidStatusDetail');
    const rfidVerificationProgress = document.getElementById('rfidVerificationProgress');
    const rfidSuccessMessage = document.getElementById('rfidSuccessMessage');
    const rfidErrorMessage = document.getElementById('rfidErrorMessage');
    
    // Reset to initial state
    rfidDisplay.value = '';
    rfidDisplay.placeholder = 'Waiting for card scan...';
    rfidStatusCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    rfidStatusIcon.className = 'fas fa-wifi ready';
    rfidStatusText.textContent = 'Ready to Scan';
    rfidStatusDetail.textContent = 'Place your RFID card on the reader';
    
    rfidVerificationProgress.style.display = 'none';
    rfidSuccessMessage.style.display = 'none';
    rfidErrorMessage.style.display = 'none';
    
    updateStatus('Ready to scan...', 'waiting');
}

// Don't auto-start scanner on page load
document.addEventListener('DOMContentLoaded', () => {
    // Scanner will start when user clicks the button
    console.log('Hospital portal loaded. Click "Start QR Code Scanner" to begin.');
    
    // Initialize RFID capture
    initRFIDCapture();
    
    // Initialize RFID UI to ready state
    resetRFIDUI();
});
