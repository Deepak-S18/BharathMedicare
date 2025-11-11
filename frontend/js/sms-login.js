let currentPhone = '';

// Handle phone form submission
document.getElementById('phoneForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const phone = document.getElementById('phone').value;
    
    // Validate phone number
    if (!/^[0-9]{10}$/.test(phone)) {
        showError('Please enter a valid 10-digit mobile number');
        return;
    }
    
    showLoading();
    
    try {
        const response = await apiCall(API_ENDPOINTS.SEND_OTP, {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
        
        currentPhone = phone;
        
        console.log('Phone number stored:', currentPhone);
        
        // Show OTP form and hide phone form
        document.getElementById('phoneForm').style.display = 'none';
        document.getElementById('otpForm').style.display = 'block';
        document.getElementById('displayPhone').textContent = phone;
        
        // Also store in a hidden input as backup
        let hiddenPhoneInput = document.getElementById('hiddenPhone');
        if (!hiddenPhoneInput) {
            hiddenPhoneInput = document.createElement('input');
            hiddenPhoneInput.type = 'hidden';
            hiddenPhoneInput.id = 'hiddenPhone';
            document.getElementById('otpForm').appendChild(hiddenPhoneInput);
        }
        hiddenPhoneInput.value = phone;
        
        showSuccess('OTP sent successfully to your mobile number');
        
    } catch (error) {
        showError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
        hideLoading();
    }
});

// Handle OTP form submission
document.getElementById('otpForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const otp = document.getElementById('otp').value;
    
    // Validate OTP
    if (!/^[0-9]{6}$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP');
        return;
    }
    
    // Get phone from hidden input as backup
    const hiddenPhone = document.getElementById('hiddenPhone')?.value;
    const phoneToUse = currentPhone || hiddenPhone;
    
    // Check if phone number is available
    if (!phoneToUse) {
        showError('Phone number not found. Please refresh and try again.');
        return;
    }
    
    showLoading();
    
    try {
        console.log('Current phone variable:', currentPhone);
        console.log('Hidden phone input:', hiddenPhone);
        console.log('Phone to use:', phoneToUse);
        console.log('OTP:', otp);
        
        const payload = { 
            phone: phoneToUse,
            otp: otp 
        };
        
        console.log('Payload:', JSON.stringify(payload));
        
        const response = await apiCall(API_ENDPOINTS.VERIFY_OTP, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        console.log('Verification response:', response);
        
        // Store token and user data
        setAuthToken(response.token);
        setUserData(response.user);
        
        showSuccess('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
            redirectToDashboard(response.user.role);
        }, 1000);
        
    } catch (error) {
        console.error('Verification error:', error);
        showError(error.message || 'Invalid OTP. Please try again.');
    } finally {
        hideLoading();
    }
});

// Resend OTP function
async function resendOTP() {
    if (!currentPhone) {
        showError('Phone number not found. Please start over.');
        return;
    }
    
    showLoading();
    
    try {
        const response = await apiCall(API_ENDPOINTS.SEND_OTP, {
            method: 'POST',
            body: JSON.stringify({ phone: currentPhone })
        });
        
        showSuccess('OTP resent successfully');
        
        // Clear OTP input
        document.getElementById('otp').value = '';
        
    } catch (error) {
        showError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
        hideLoading();
    }
}

// Redirect to dashboard based on role
function redirectToDashboard(role) {
    // Clear hospital access flag on regular login
    localStorage.removeItem('hospital_access');
    
    switch(role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'doctor':
            window.location.href = 'doctor-dashboard.html';
            break;
        case 'patient':
            window.location.href = 'patient-dashboard.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}
