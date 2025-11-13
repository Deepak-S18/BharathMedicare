# 🏥 BharathMedicare - Digital Healthcare Management System

A comprehensive, secure, and user-friendly healthcare management platform designed for the Indian healthcare ecosystem. BharathMedicare enables seamless management of medical records, doctor-patient interactions, and hospital operations with advanced security features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [User Roles](#-user-roles)
- [Security Features](#-security-features)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Multi-Factor Authentication
- **Email/Password Login** - Traditional secure authentication
- **SMS OTP Login** - Phone-based verification via Twilio
- **RFID Card Access** - Quick hospital kiosk authentication
- **QR Code Scanning** - Instant patient/doctor verification

### 👥 Role-Based Access Control

#### **Patients**
- 📱 Digital Health Card with QR code
- 📄 Upload and manage medical records (PDF, images)
- 🔒 Encrypted document storage
- 👨‍⚕️ Grant/revoke doctor access to records
- 📅 Book appointments with doctors
- 🔗 Link RFID card for hospital access
- 📊 View medical history and statistics

#### **Doctors**
- 🏥 Professional Doctor ID Card
- 👤 View authorized patient records
- 📋 Manage appointment requests
- 🔍 Search patient medical history
- 📞 Access patient contact information
- 🎓 Display credentials and qualifications
- 🔗 Link RFID card for hospital access

#### **Administrators**
- 👨‍💼 Verify and approve doctor registrations
- 📊 System-wide analytics and statistics
- 👥 User management (activate/deactivate)
- 🔐 RFID card management (link/update/remove)
- 📝 Audit logs and activity tracking
- 🗑️ User account deletion

### 🏥 Hospital Portal
- 📷 QR Code scanner for patient/doctor verification
- 💳 RFID card reader integration
- 📋 Quick access to patient records
- 👨‍⚕️ Doctor credential verification
- 🔒 Read-only secure access

### 🎨 User Experience
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive design
- ♿ Accessibility compliant
- 🌐 Multi-language support ready
- ⚡ Fast and intuitive interface

## 🛠 Technology Stack

### Frontend
- **HTML5/CSS3** - Modern, semantic markup
- **JavaScript (ES6+)** - Vanilla JS for performance
- **Font Awesome** - Icon library
- **QRCode.js** - QR code generation
- **html5-qrcode** - QR code scanning
- **html2canvas** - Card image generation

### Backend
- **Python 3.8+** - Core backend language
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyJWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Twilio** - SMS OTP service

### Database
- **MongoDB** - NoSQL document database
- **PyMongo** - MongoDB driver for Python

### Security
- **JWT Tokens** - Stateless authentication
- **Bcrypt** - Password encryption
- **CORS** - Cross-origin protection
- **Input Validation** - XSS/SQL injection prevention
- **Session Management** - Secure token handling

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

## 🏗 System Architecture

```
BharathMedicare/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app initialization
│   │   ├── blueprints/           # API route modules
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   ├── users.py          # User management
│   │   │   ├── records.py        # Medical records
│   │   │   ├── access.py         # Access control
│   │   │   ├── appointments.py   # Appointment system
│   │   │   ├── doctors.py        # Doctor operations
│   │   │   ├── admin.py          # Admin functions
│   │   │   └── analytics.py      # Statistics & analytics
│   │   ├── models/
│   │   │   ├── database.py       # MongoDB connection
│   │   │   └── schemas.py        # Data models
│   │   └── utils/
│   │       ├── encryption.py     # File encryption
│   │       └── validators.py     # Input validation
│   ├── uploads/                  # Encrypted file storage
│   ├── logs/                     # Application logs
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── theme.css         # Theme variables
│   │   │   ├── dashboard.css     # Dashboard styles
│   │   │   ├── auth-pages.css    # Login/register styles
│   │   │   └── landing.css       # Homepage styles
│   │   └── images/               # Static images
│   ├── js/
│   │   ├── config.js             # API configuration
│   │   ├── api.js                # API helper functions
│   │   ├── auth.js               # Authentication logic
│   │   ├── auth-guard.js         # Route protection
│   │   ├── ui.js                 # UI utilities
│   │   ├── theme-toggle.js       # Theme management
│   │   ├── patient-dashboard.js  # Patient features
│   │   ├── doctor-dashboard.js   # Doctor features
│   │   ├── admin-dashboard.js    # Admin features
│   │   ├── hospital-portal.js    # Hospital kiosk
│   │   └── hospital-doctor-view.js
│   └── pages/
│       ├── index.html            # Landing page
│       ├── login.html            # Email login
│       ├── sms-login.html        # SMS OTP login
│       ├── register.html         # User registration
│       ├── patient-dashboard.html
│       ├── doctor-dashboard.html
│       ├── admin-dashboard.html
│       ├── hospital-portal.html  # QR/RFID scanner
│       ├── hospital-patient-view.html
│       └── hospital-doctor-view.html
│
├── docker-compose.yml            # Docker orchestration
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- MongoDB 4.4 or higher
- Node.js (optional, for development)
- Docker & Docker Compose (optional)

### Method 1: Docker Installation (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/Deepak-S18/BharathMedicare.git
cd BharathMedicare
```

2. **Configure environment variables**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

### Method 2: Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/Deepak-S18/BharathMedicare.git
cd BharathMedicare
```

2. **Setup Backend**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

3. **Setup MongoDB**
```bash
# Install MongoDB locally or use MongoDB Atlas
# Update MONGO_URI in .env file
```

4. **Start Backend Server**
```bash
python run.py
# Server runs on http://localhost:5000
```

5. **Setup Frontend**
```bash
cd ../frontend

# Option 1: Use Python HTTP server
python -m http.server 8080

# Option 2: Use Node.js http-server
npx http-server -p 8080

# Frontend runs on http://localhost:8080
```

## ⚙️ Configuration

### Backend Environment Variables (.env)

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DEBUG=True

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/bharathmedicare

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600

# Twilio SMS Configuration (for OTP)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_FOLDER=uploads
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png

# CORS Configuration
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key
```

### Frontend Configuration (js/config.js)

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://your-production-api.com';
```

## 🚀 Usage

### Creating Admin Account

```bash
cd backend
python create_admin.py
```

Follow the prompts to create an admin account.

### User Registration Flow

1. **Patient Registration**
   - Visit `/pages/register.html`
   - Select "Patient" role
   - Fill in personal details
   - Complete profile with medical information
   - Link RFID card (optional)

2. **Doctor Registration**
   - Visit `/pages/register.html`
   - Select "Doctor" role
   - Provide NMC UID (7-digit)
   - Fill professional details
   - Wait for admin approval
   - Link RFID card after approval

### Login Methods

1. **Email/Password Login**
   - Visit `/pages/login.html`
   - Enter credentials
   - Access role-specific dashboard

2. **SMS OTP Login**
   - Visit `/pages/sms-login.html`
   - Enter phone number
   - Receive OTP via SMS
   - Enter OTP to login

3. **RFID Card Login**
   - Visit `/pages/hospital-portal.html`
   - Scan RFID card on reader
   - Automatic authentication

4. **QR Code Login**
   - Visit `/pages/hospital-portal.html`
   - Scan QR code from health card
   - Instant access to records

## 👥 User Roles

### Patient Features
- ✅ Complete health profile
- ✅ Upload medical records (encrypted)
- ✅ Generate digital health card with QR code
- ✅ Grant temporary access to doctors
- ✅ Book appointments
- ✅ View appointment history
- ✅ Download/print health card
- ✅ Link RFID card (one-time, admin can modify)

### Doctor Features
- ✅ Professional profile with credentials
- ✅ View authorized patient records
- ✅ Approve/reject appointment requests
- ✅ Search patients by ID or name
- ✅ Download patient records
- ✅ Generate doctor ID card
- ✅ Link RFID card (one-time, admin can modify)

### Admin Features
- ✅ Approve/reject doctor registrations
- ✅ View system statistics
- ✅ Manage all users (activate/deactivate/delete)
- ✅ Edit user RFID cards
- ✅ View audit logs
- ✅ Monitor system activity
- ✅ Generate reports

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure, stateless authentication
- **Password Hashing** - Bcrypt with salt
- **Role-Based Access Control** - Granular permissions
- **Session Management** - Automatic token expiration
- **Multi-Factor Authentication** - SMS OTP support

### Data Protection
- **File Encryption** - AES-256 encryption for medical records
- **HTTPS Ready** - SSL/TLS support
- **Input Validation** - Prevent XSS and injection attacks
- **CORS Protection** - Controlled cross-origin access
- **Audit Logging** - Track all sensitive operations

### RFID Security
- **One-Time Linking** - Users can link RFID once
- **Admin-Only Modification** - Only admins can change RFID
- **Unique Card IDs** - Prevent duplicate registrations
- **Secure Storage** - Encrypted RFID data

### Privacy Compliance
- **Data Minimization** - Collect only necessary information
- **Access Control** - Patients control who sees their data
- **Audit Trail** - Complete activity logging
- **Right to Delete** - Users can request account deletion

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+919876543210",
  "role": "patient",
  "nmc_uid": "1234567" // Required for doctors
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

#### RFID Login
```http
POST /api/auth/rfid-login
Content-Type: application/json

{
  "rfid_id": "ABC123XYZ789"
}
```

### Medical Records Endpoints

#### Upload Record
```http
POST /api/records/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <medical_record.pdf>
description: "Blood test results"
```

#### Get My Records
```http
GET /api/records/my-records
Authorization: Bearer <token>
```

#### Download Record
```http
GET /api/records/:recordId/download
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Statistics
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

#### Update User RFID
```http
PATCH /api/admin/users/:userId/rfid
Authorization: Bearer <token>
Content-Type: application/json

{
  "rfid_id": "NEW123RFID456"
}
```

#### Verify Doctor
```http
PATCH /api/admin/verify-doctor/:doctorId
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve" // or "reject"
}
```

For complete API documentation, see [API_DOCS.md](API_DOCS.md)

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pytest tests/
```

### Test Coverage
```bash
pytest --cov=app tests/
```

### Manual Testing Checklist
- [ ] User registration (all roles)
- [ ] Login (email, SMS, RFID, QR)
- [ ] File upload and encryption
- [ ] Access control (grant/revoke)
- [ ] Appointment booking
- [ ] Admin approval workflow
- [ ] RFID card linking
- [ ] Theme toggle
- [ ] Responsive design

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Deepak S** - *Initial work* - [Deepak-S18](https://github.com/Deepak-S18)

## 🙏 Acknowledgments

- National Medical Council of India for NMC UID standards
- Twilio for SMS OTP services
- MongoDB for database solutions
- Font Awesome for icons
- All contributors and testers

## 📞 Support

For support, email support@bharathmedicare.com or open an issue on GitHub.

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Mobile app (React Native)
- [ ] Telemedicine video consultations
- [ ] Prescription management
- [ ] Lab test integration
- [ ] Insurance claim processing
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] AI-powered health insights
- [ ] Blockchain for record verification

### Version 1.1 (In Progress)
- [x] RFID card integration
- [x] Hospital portal with QR scanner
- [x] Dark theme support
- [x] Admin RFID management
- [ ] Email notifications
- [ ] SMS appointment reminders
- [ ] Export records to PDF
- [ ] Advanced search filters

## 📊 Project Status

![GitHub last commit](https://img.shields.io/github/last-commit/Deepak-S18/BharathMedicare)
![GitHub issues](https://img.shields.io/github/issues/Deepak-S18/BharathMedicare)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Deepak-S18/BharathMedicare)

**Current Version:** 1.0.0  
**Status:** Active Development  
**Last Updated:** November 2024

---

Made with ❤️ for Indian Healthcare System
