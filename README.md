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
- 🤖 **AI Clinical Decision Support System**
- 💊 AI-powered prescription generation
- 📄 Generate & save prescription PDFs
- 🔍 Medication safety checking
- 📊 Differential diagnosis suggestions

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

### 🤖 AI Clinical Decision Support (CDS)
- **Ambient AI Assistant** - Non-intrusive clinical suggestions
- **Google Gemini AI Integration** - Latest AI model (gemini-2.0-flash)
- **Differential Diagnosis** - AI-powered diagnosis suggestions
- **Medication Safety** - Drug interaction checking
- **Treatment Plan Generation** - Comprehensive care plans
- **Prescription PDF Generation** - Professional medical documents
- **Context-Aware Triggers** - Smart activation based on workflow
- **Learning System** - Adapts to physician preferences

### 💊 Prescription Management
- **AI-Powered Generation** - Automatic prescription creation
- **Professional PDF Format** - Medical-grade documents
- **AES-256 Encryption** - Secure storage in MongoDB
- **Digital Signatures** - Legitimate medical prescriptions
- **Patient Record Integration** - Automatic saving to medical records
- **Medication Safety Checks** - Real-time interaction warnings
- **Auto-Redirect** - Seamless workflow after saving

### 🎨 User Experience
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive design
- ♿ Accessibility compliant
- 🌐 Multi-language support ready
- ⚡ Fast and intuitive interface
- 🎯 Clean, professional UI
- 📊 Real-time updates

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
- **Google Generative AI** - Gemini AI integration
- **ReportLab** - PDF generation library
- **Cryptography** - AES-256 encryption

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
│   │   │   ├── cds.py            # Clinical Decision Support
│   │   │   └── analytics.py      # Statistics & analytics
│   │   ├── ai_cds/               # AI CDS System
│   │   │   ├── engine.py         # CDS core engine
│   │   │   ├── gemini_integration.py  # Google Gemini AI
│   │   │   ├── context_analyzer.py    # Patient context
│   │   │   ├── knowledge_base.py      # Medical knowledge
│   │   │   ├── drug_interactions.py   # Drug safety
│   │   │   └── learning.py       # Learning system
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
│   │   ├── cds-ambient.js        # AI CDS sidebar
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
│       ├── hospital-doctor-view.html
│       └── cds-demo.html         # AI Clinical Assistant
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

# Google Gemini AI Configuration (for CDS)
GEMINI_API_KEY=your-gemini-api-key-here
```

**Get Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get your free API key.

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
- ✅ **AI Clinical Decision Support**
- ✅ AI-powered prescription generation
- ✅ Medication safety checking
- ✅ Generate & save prescription PDFs
- ✅ Differential diagnosis suggestions

### Admin Features
- ✅ Approve/reject doctor registrations
- ✅ View system statistics
- ✅ Manage all users (activate/deactivate/delete)
- ✅ Edit user RFID cards
- ✅ View audit logs
- ✅ Monitor system activity
- ✅ Generate reports

## 🤖 AI Clinical Decision Support System

### Overview
BharathMedicare includes a state-of-the-art AI Clinical Decision Support (CDS) system powered by Google Gemini AI, designed to assist doctors in making informed clinical decisions.

### Key Features

#### 1. **Ambient AI Assistant**
- Non-intrusive sidebar interface
- Context-aware suggestions
- Real-time analysis
- No workflow interruption

#### 2. **AI-Powered Diagnosis**
- Differential diagnosis suggestions
- Confidence scoring
- Evidence-based recommendations
- Patient context integration

#### 3. **Medication Safety**
- Drug-drug interaction checking
- Allergy cross-sensitivity alerts
- Contraindication warnings
- Dosage recommendations

#### 4. **Treatment Plan Generation**
- Comprehensive prescription creation
- Care plan instructions
- Follow-up recommendations
- Required tests/scans suggestions

#### 5. **Prescription PDF Generation**
- Professional medical-grade PDFs
- AES-256 encrypted storage
- Automatic saving to patient records
- Digital signature ready
- Legitimate medical format

### How to Use AI CDS

1. **Access AI Assistant**
   - Login as doctor
   - Navigate to Doctor Dashboard
   - Click "AI Clinical Assistant" in sidebar
   - Click "Launch AI Assistant"

2. **Select Patient**
   - Choose patient from dropdown
   - AI analyzes patient context automatically
   - View patient history and risk factors

3. **Enter Clinical Information**
   - Type symptoms in symptoms field
   - AI provides differential diagnosis
   - Enter vital signs
   - Focus on diagnosis field for suggestions

4. **Generate Treatment Plan**
   - Click "Generate Plan" button
   - AI creates comprehensive prescription
   - Review and edit as needed
   - Medications auto-populated

5. **Check Medication Safety**
   - Click "Check Safety" button
   - AI analyzes drug interactions
   - View warnings and recommendations
   - Adjust medications if needed

6. **Save Prescription**
   - Click "Save to Records" button
   - Professional PDF generated
   - Encrypted and saved to patient records
   - Auto-redirect to dashboard

### AI CDS Architecture

```
Patient Context → AI Analysis → Suggestions
     ↓                ↓              ↓
 Demographics    Gemini AI      Diagnosis
 Medical History  Knowledge     Medications
 Current Meds     Base          Safety Checks
 Allergies        Learning      Care Plans
```

### Supported Features

| Feature | Description | Status |
|---------|-------------|--------|
| Differential Diagnosis | AI-powered diagnosis suggestions | ✅ Active |
| Medication Safety | Drug interaction checking | ✅ Active |
| Treatment Plans | Comprehensive care plans | ✅ Active |
| Prescription PDFs | Professional PDF generation | ✅ Active |
| Learning System | Adapts to physician preferences | ✅ Active |
| Context Analysis | Patient history integration | ✅ Active |

### AI Models Used

- **Google Gemini 2.0 Flash** - Latest AI model for medical queries
- **Knowledge Base** - Curated medical knowledge
- **Drug Database** - Comprehensive medication information
- **Learning System** - Physician preference tracking

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure, stateless authentication
- **Password Hashing** - Bcrypt with salt
- **Role-Based Access Control** - Granular permissions
- **Session Management** - Automatic token expiration
- **Multi-Factor Authentication** - SMS OTP support

### Data Protection
- **File Encryption** - AES-256 encryption for medical records
- **Prescription Encryption** - All prescription PDFs encrypted
- **HTTPS Ready** - SSL/TLS support
- **Input Validation** - Prevent XSS and injection attacks
- **CORS Protection** - Controlled cross-origin access
- **Audit Logging** - Track all sensitive operations
- **Secure PDF Storage** - Encrypted in MongoDB, not filesystem

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

### AI Clinical Decision Support Endpoints

#### Analyze Patient Context
```http
POST /api/cds/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": "507f1f77bcf86cd799439011",
  "context": {
    "symptoms": ["chest pain", "shortness of breath"],
    "vitals": {
      "blood_pressure": "140/90",
      "heart_rate": "95"
    }
  },
  "trigger_type": "passive"
}
```

#### Check Medication Safety
```http
POST /api/cds/medication-safety
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": "507f1f77bcf86cd799439011",
  "medication": "Warfarin",
  "dose": "5mg"
}
```

#### Generate AI Treatment Plan
```http
POST /api/cds/ai-generate-treatment
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": "507f1f77bcf86cd799439011",
  "symptoms": "chest pain, shortness of breath",
  "diagnosis": "Acute Coronary Syndrome",
  "vitals": {
    "blood_pressure": "140/90",
    "heart_rate": "95",
    "temperature": "98.6",
    "spo2": "95"
  },
  "chronic_conditions": ["Hypertension", "Diabetes"],
  "allergies": ["Penicillin"],
  "current_medications": ["Metformin", "Lisinopril"]
}
```

#### Save Prescription as PDF
```http
POST /api/cds/save-prescription
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": "507f1f77bcf86cd799439011",
  "prescription": {
    "diagnosis": "Hypertension with Type 2 Diabetes",
    "medications": [
      "Metformin 500mg - 1 tablet twice daily with meals",
      "Lisinopril 10mg - 1 tablet once daily in the morning"
    ],
    "instructions": "Follow diabetic diet, monitor blood glucose regularly",
    "next_checkup": "Complete HbA1c test in 3 months"
  }
}
```

#### Record Physician Feedback
```http
POST /api/cds/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "suggestion_type": "differential_diagnosis",
  "suggestion_content": "Acute Coronary Syndrome",
  "action": "accepted",
  "reason": "Matches clinical presentation"
}
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
- [x] **AI-powered Clinical Decision Support (Google Gemini AI)**
- [x] **Ambient CDS with real-time medical knowledge**
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
