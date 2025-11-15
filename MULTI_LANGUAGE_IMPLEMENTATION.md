# Multi-Language Support Implementation

## Overview
BharathMedicare now supports 5 major Indian languages to improve accessibility across the Indian healthcare ecosystem:

- **English (en)** - Default language
- **Hindi (hi)** - हिंदी - Most widely spoken
- **Telugu (te)** - తెలుగు - Andhra Pradesh, Telangana
- **Kannada (kn)** - ಕನ್ನಡ - Karnataka
- **Tamil (ta)** - தமிழ் - Tamil Nadu, Puducherry

## Implementation Details

### Backend (Flask-Babel)

#### 1. Dependencies Added
```
Flask-Babel==4.0.0
```

#### 2. Configuration
- Babel initialized in `backend/app/__init__.py`
- Locale detection from `Accept-Language` header
- Supported locales: en, hi, te, kn, ta
- Translation directory: `backend/translations/`

#### 3. Usage in Backend
```python
from flask_babel import gettext

@app.route('/api/message')
def get_message():
    return jsonify({
        'message': gettext('Welcome to BharathMedicare')
    })
```

### Frontend (Vanilla JavaScript)

#### 1. Core Files
- **translations.js** - All translation strings for 5 languages
- **i18n.js** - Translation engine with locale management
- **language-selector.js** - UI component for language switching

#### 2. Features
- Automatic language detection from browser
- Persistent language preference (localStorage)
- Dynamic page translation without reload
- Date/time formatting per locale
- Language selector dropdown in navbar

#### 3. Usage in HTML
```html
<!-- Text translation -->
<h1 data-i18n="dashboard.welcomeBack">Welcome Back</h1>

<!-- Placeholder translation -->
<input data-i18n-placeholder="auth.email" placeholder="Email">

<!-- Title translation -->
<button data-i18n-title="common.save" title="Save">💾</button>
```

#### 4. Usage in JavaScript
```javascript
// Get translation
const text = I18n.t('common.welcome');

// With parameters
const msg = I18n.t('messages.greeting', { name: 'User' });

// Change language
I18n.setLocale('hi');

// Format date
const date = I18n.formatDate(new Date());
```

## Translation Coverage

### Current Translations
All patient-facing pages have been prepared for translation:

1. **Landing Page** (index.html)
   - Hero section
   - Services
   - About
   - Contact
   - Footer

2. **Authentication Pages**
   - Login
   - Register
   - SMS Login
   - Password Reset

3. **Patient Dashboard**
   - Dashboard overview
   - Digital Health Card
   - Medical Records
   - Upload Records
   - Appointments
   - Profile Management

4. **Common UI Elements**
   - Navigation menus
   - Buttons and labels
   - Form fields
   - Success/error messages
   - Loading states

### Translation Keys Structure
```
common.*          - Buttons, labels, actions
nav.*             - Navigation items
auth.*            - Login, register, authentication
dashboard.*       - Dashboard elements
patient.*         - Patient portal sections
healthCard.*      - Health card content
records.*         - Medical records management
appointments.*    - Appointment booking
messages.*        - System messages
```

## Installation & Setup

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. (Optional) Create translation files:
```bash
# Extract translatable strings
pybabel extract -F babel.cfg -o messages.pot .

# Initialize language (example: Hindi)
pybabel init -i messages.pot -d translations -l hi

# Compile translations
pybabel compile -d translations
```

### Frontend Setup

No additional setup required! The i18n system is automatically initialized when pages load.

## Usage Guide

### For Developers

#### Adding New Translations

1. **Add to translations.js**:
```javascript
const TRANSLATIONS = {
    en: {
        myFeature: {
            title: 'My Feature',
            description: 'Feature description'
        }
    },
    hi: {
        myFeature: {
            title: 'मेरी सुविधा',
            description: 'सुविधा विवरण'
        }
    }
    // ... add for all languages
};
```

2. **Use in HTML**:
```html
<h2 data-i18n="myFeature.title">My Feature</h2>
<p data-i18n="myFeature.description">Feature description</p>
```

3. **Use in JavaScript**:
```javascript
const title = I18n.t('myFeature.title');
showSuccess(I18n.t('messages.success'));
```

### For Users

1. **Changing Language**:
   - Look for the globe icon (🌐) in the navigation bar
   - Click the dropdown and select your preferred language
   - The page will instantly translate
   - Your preference is saved automatically

2. **Supported Pages**:
   - All patient-facing pages support translation
   - Doctor and admin portals can be extended similarly

## Testing

### Manual Testing Checklist

- [ ] Language selector appears in navbar
- [ ] All 5 languages are available in dropdown
- [ ] Switching language updates all visible text
- [ ] Language preference persists after page reload
- [ ] No text overflow with longer translations
- [ ] Forms work correctly in all languages
- [ ] Success/error messages are translated
- [ ] Date formats are locale-appropriate

### Browser Testing
```javascript
// Open browser console and test:

// Check current language
console.log(I18n.currentLocale);

// Test translation
console.log(I18n.t('common.welcome'));

// Switch language
I18n.setLocale('hi');

// Verify translation changed
console.log(I18n.t('common.welcome'));
```

## Best Practices

### 1. Always Provide English Fallback
```javascript
// Good
en: { key: 'English text' },
hi: { key: 'हिंदी पाठ' }

// Bad - missing English
hi: { key: 'हिंदी पाठ' }
```

### 2. Use Semantic Keys
```javascript
// Good
'patient.profile.edit'

// Bad
'edit_button_1'
```

### 3. Handle Dynamic Content
```javascript
// Use parameters for dynamic values
I18n.t('messages.welcome', { name: userName });
```

### 4. Test UI with All Languages
- Hindi and Telugu text may be longer
- Ensure buttons and containers accommodate longer text
- Test on mobile devices

### 5. Cultural Sensitivity
- Ensure translations are culturally appropriate
- Use formal language for medical content
- Consider regional variations

## Roadmap

### Phase 1 (Current) ✅
- [x] Core i18n infrastructure
- [x] 5 language support (en, hi, te, kn, ta)
- [x] Patient portal translation
- [x] Language selector UI

### Phase 2 (Planned)
- [ ] Doctor portal translation
- [ ] Admin portal translation
- [ ] Email templates translation
- [ ] SMS notifications translation

### Phase 3 (Future)
- [ ] Additional languages (Bengali, Marathi, Gujarati)
- [ ] RTL support for Urdu
- [ ] Voice-based language selection
- [ ] Regional dialect support

## Troubleshooting

### Issue: Translations not showing
**Solution**: 
- Check browser console for errors
- Verify translations.js is loaded
- Ensure data-i18n attribute is correct

### Issue: Language not persisting
**Solution**:
- Check localStorage is enabled
- Clear browser cache
- Verify STORAGE_KEYS.LANGUAGE is set

### Issue: Some text not translating
**Solution**:
- Check if element has data-i18n attribute
- Verify translation key exists in translations.js
- Call I18n.translatePage() manually if needed

## Support & Documentation

- **Frontend Guide**: `frontend/I18N_GUIDE.md`
- **Translation Keys**: `frontend/js/translations.js`
- **Core Engine**: `frontend/js/i18n.js`

## Contributing

To add support for a new language:

1. Add language to `APP_CONFIG.SUPPORTED_LANGUAGES` in config.js
2. Add translation object to `TRANSLATIONS` in translations.js
3. Update backend locale selector in `app/__init__.py`
4. Test thoroughly across all pages
5. Submit pull request with documentation

## License

This i18n implementation is part of BharathMedicare and follows the same license as the main project.

---

**Note**: This implementation focuses on UI translation. User-generated content (medical records, doctor notes, etc.) is not translated automatically.
