// Authentication JavaScript for BharathMedicare

// ============================================
// LOGIN HANDLER
// ============================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showLoading();
    
    try {
        const response = await apiCall(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Store token and user data
        setAuthToken(response.token);
        setUserData(response.user);
        
        showSuccess('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
            redirectToDashboard(response.user.role);
        }, 1000);
        
    } catch (error) {
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        hideLoading();
    }
}

// ============================================
// OTP VERIFICATION FOR REGISTRATION
// ============================================

let isPhoneVerified = false;
let otpSent = false;

async function handleOTPAction() {
    const phoneInput = document.getElementById('phone');
    const otpInput = document.getElementById('otp');
    const otpSection = document.getElementById('otpSection');
    const otpButton = document.getElementById('otpButton');
    const registerButton = document.getElementById('registerButton');
    const verificationStatus = document.getElementById('verificationStatus');
    const otpMessage = document.getElementById('otpMessage');
    
    const phone = phoneInput.value.trim();
    
    // Validate phone number
    if (!phone) {
        showError('Please enter your phone number');
        return;
    }
    
    // Ensure phone has country code
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/\D/g, '');
    }
    
    if (!otpSent) {
        // Send OTP
        showLoading();
        try {
            const response = await apiCall(API_ENDPOINTS.SEND_OTP, {
                method: 'POST',
                body: JSON.stringify({ phone: formattedPhone })
            });
            
            showSuccess('OTP sent successfully to ' + formattedPhone);
            
            // Update UI
            otpSent = true;
            otpSection.style.display = 'block';
            phoneInput.disabled = true;
            otpButton.innerHTML = '<i class="fas fa-check"></i> Verify OTP';
            otpButton.style.background = 'var(--success-color)';
            otpMessage.textContent = 'OTP sent to ' + formattedPhone;
            
        } catch (error) {
            showError(error.message || 'Failed to send OTP. Please try again.');
        } finally {
            hideLoading();
        }
        
    } else {
        // Verify OTP
        const otp = otpInput.value.trim();
        
        if (!otp || otp.length !== 6) {
            showError('Please enter a valid 6-digit OTP');
            return;
        }
        
        showLoading();
        try {
            const response = await apiCall(API_ENDPOINTS.VERIFY_OTP_REGISTRATION, {
                method: 'POST',
                body: JSON.stringify({ 
                    phone: formattedPhone,
                    otp: otp 
                })
            });
            
            if (response.valid) {
                showSuccess('Phone number verified successfully!');
                
                // Update UI
                isPhoneVerified = true;
                otpSection.style.display = 'none';
                otpButton.style.display = 'none';
                registerButton.disabled = false;
                verificationStatus.style.display = 'block';
                
            } else {
                showError('Invalid OTP. Please try again.');
            }
            
        } catch (error) {
            showError(error.message || 'OTP verification failed. Please try again.');
        } finally {
            hideLoading();
        }
    }
}

// ============================================
// REGISTER HANDLER
// ============================================

async function handleRegister(event) {
    event.preventDefault();
    
    // Check if phone is verified
    if (!isPhoneVerified) {
        showError('Please verify your phone number first');
        return;
    }
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    let phone = document.getElementById('phone')?.value;
    const nmcUid = document.getElementById('nmcUid')?.value;
    const isDiabeticInput = document.getElementById('isDiabetic');
    
    // Format phone number
    if (phone && !phone.startsWith('+')) {
        phone = '+91' + phone.replace(/\D/g, '');
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Validate NMC UID for doctors
    if (role === 'doctor') {
        if (!nmcUid) {
            showError('NMC UID is required for doctor registration');
            return;
        }
        if (!/^\d{7}$/.test(nmcUid)) {
            showError('NMC UID must be exactly 7 digits');
            return;
        }
    }
    
    showLoading();
    
    try {
        const registerData = {
            full_name: fullName,
            email,
            password,
            role,
            phone
        };
        
        // Add NMC UID if doctor
        if (role === 'doctor') {
            registerData.nmc_uid = nmcUid;
        } else if (role === 'patient') {
            // ADD DIABETIC STATUS FOR PATIENT (isDiabetic is a boolean based on dropdown value)
            registerData.is_diabetic = isDiabeticInput ? isDiabeticInput.value === 'true' : false;
        }
        
        const response = await apiCall(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        // Different handling for doctors vs patients
        if (response.requires_approval) {
            showSuccess('Registration successful! Your account is pending admin approval. You will be notified once verified.', 5000);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            // Patient: Directs them to log in to complete the profile
            showSuccess('Basic registration successful! Please log in immediately to complete your detailed health profile.', 5000);
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000); // Increased delay to 3s to read message
        }
        
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// ============================================
// PASSWORD TOGGLE
// ============================================

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ============================================
// ROLE FIELD TOGGLE (for register page)
// UPDATED to include Diabetic Status toggle
// ============================================

function toggleNMCField() {
    const role = document.getElementById('role').value;
    const nmcField = document.getElementById('nmcField');
    const nmcInput = document.getElementById('nmcUid');
    const diabeticField = document.getElementById('diabeticField');
    const isDiabeticInput = document.getElementById('isDiabetic');

    if (role === 'doctor') {
        // Show NMC for doctors, hide diabetic
        nmcField.style.display = 'block';
        diabeticField.style.display = 'none';
        nmcInput.required = true;
        isDiabeticInput.required = false;

    } else if (role === 'patient') {
        // Show diabetic for patients, hide NMC
        nmcField.style.display = 'none';
        diabeticField.style.display = 'block';
        nmcInput.required = false;
        isDiabeticInput.required = true; // Diabtic status is now mandatory for quick registration

    } else {
        // Default state
        nmcField.style.display = 'none';
        diabeticField.style.display = 'none';
        nmcInput.required = false;
        isDiabeticInput.required = false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all local storage items related to auth
        localStorage.clear();
        
        // Clear session storage as well
        sessionStorage.clear();
        
        // Show success message briefly
        showSuccess('Logged out successfully');
        
        // Delay redirect slightly to ensure storage is cleared
        setTimeout(() => {
            window.location.href = '../index.html?logout=true';
        }, 500);
    }
}

// ============================================
// AUTO-FOCUS (on page load)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Auto-focus first input field
    const firstInput = document.querySelector('input[type="text"], input[type="email"]');
    if (firstInput) {
        firstInput.focus();
    }
    
    // Initial call to set correct display state for conditional fields
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        toggleNMCField(); 
    }
});