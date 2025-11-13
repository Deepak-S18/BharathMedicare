// frontend/js/config.js

// Configuration JavaScript

// API Base URL - adjust this based on your environment
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    // Vercel deployment - update this with your actual backend URL
    // Option 1: If backend is on Render
    if (hostname.includes('vercel.app')) {
        return 'https://bharathmedicare.onrender.com';
    }
    
    // Option 2: If backend is on same domain (not recommended for Vercel free tier)
    // return window.location.origin;
    
    // Default production URL
    return 'https://bharathmedicare.onrender.com';
})();

// API Endpoints
const API_ENDPOINTS = {
    // Health check
    HEALTH: '/api/health',
    
    // Authentication
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_TOKEN: '/api/auth/verify',
    SEND_OTP: '/api/auth/send-otp',
    VERIFY_OTP: '/api/auth/verify-otp', // For SMS login
    VERIFY_OTP_REGISTRATION: '/api/auth/verify-otp-registration', // For registration
    CHECK_RFID: '/api/auth/check-rfid', // Check if RFID is available
    RFID_LOGIN: '/api/auth/rfid-login', // Login using RFID card
    HOSPITAL_LOGIN: '/api/auth/hospital-login', // Hospital portal QR login
    
    // User endpoints
    CURRENT_USER: '/api/users/me',
    GET_USER: (userId) => `/api/users/${userId}`,
    ALL_USERS: '/api/users/all',
    UPDATE_PROFILE: '/api/users/update-profile',
    UPLOAD_PHOTO: '/api/users/upload-photo',
    DELETE_PHOTO: '/api/users/delete-photo',
    
    // Patient endpoints
    PATIENT_PROFILE: '/api/patients/profile',
    LIST_PATIENTS: '/api/patients/list',
    HEALTH_CARD: '/api/patients/health-card',
    
    // Doctors endpoints
    DOCTOR_CARD: '/api/doctors/doctor-card',
    
    // Records endpoints
    UPLOAD_RECORD: '/api/records/upload',
    MY_RECORDS: '/api/records/my-records',
    GET_RECORD: (recordId) => `/api/records/${recordId}`,
    DOWNLOAD_RECORD: (recordId) => `/api/records/${recordId}/download`,
    DELETE_RECORD: (recordId) => `/api/records/${recordId}`,
    PATIENT_RECORDS: (patientId) => `/api/records/patient/${patientId}`,
    
    // Access control endpoints
    GRANT_ACCESS: '/api/access/grant',
    REVOKE_ACCESS: '/api/access/revoke',
    MY_PERMISSIONS: '/api/access/my-permissions',
    
    // Appointments endpoints
    SEARCH_DOCTORS: '/api/appointments/search-doctors',
    BOOK_APPOINTMENT: '/api/appointments/book',
    MY_APPOINTMENTS: '/api/appointments/my-appointments',
    APPROVE_APPOINTMENT: (appointmentId) => `/api/appointments/${appointmentId}/approve`,
    REJECT_APPOINTMENT: (appointmentId) => `/api/appointments/${appointmentId}/reject`,
    CANCEL_APPOINTMENT: (appointmentId) => `/api/appointments/${appointmentId}/cancel`,
    
    // Admin endpoints
    ADMIN_STATS: '/api/admin/stats',
    AUDIT_LOGS: '/api/admin/audit-logs',
    TOGGLE_USER_STATUS: (userId) => `/api/admin/users/${userId}/toggle-status`,
    DELETE_USER: (userId) => `/api/admin/users/${userId}`,
    UPDATE_USER_RFID: (userId) => `/api/admin/users/${userId}/rfid`,
    PENDING_DOCTORS: '/api/admin/pending-doctors',
    VERIFY_DOCTOR: (doctorId) => `/api/admin/verify-doctor/${doctorId}`
};

// Local storage keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'bharath_medicare_token',
    USER_DATA: 'bharath_medicare_user'
};

// Application constants
const APP_CONFIG = {
    APP_NAME: 'Bharath Medicare',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_PHOTO_SIZE: 2 * 1024 * 1024, // 2MB for profile photos
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ],
    ALLOWED_PHOTO_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ],
    PASSWORD_MIN_LENGTH: 8,
    NMC_UID_LENGTH: 7
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_ENDPOINTS,
        STORAGE_KEYS,
        APP_CONFIG
    };
}