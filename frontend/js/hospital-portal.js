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

// Don't auto-start scanner on page load
document.addEventListener('DOMContentLoaded', () => {
    // Scanner will start when user clicks the button
    console.log('Hospital portal loaded. Click "Start QR Code Scanner" to begin.');
});
