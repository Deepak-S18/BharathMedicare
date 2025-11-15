# Quick Setup Guide for Multi-Language Support

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Flask-Babel
pip install Flask-Babel==4.0.0

# Or install all requirements
pip install -r requirements.txt
```

### 2. Verify Backend Configuration

The following files have been updated:
- ✅ `backend/requirements.txt` - Added Flask-Babel
- ✅ `backend/app/__init__.py` - Configured Babel
- ✅ `backend/babel.cfg` - Babel extraction config

### 3. Frontend Files Added

New files created:
- ✅ `frontend/js/translations.js` - All translation strings
- ✅ `frontend/js/i18n.js` - Translation engine
- ✅ `frontend/js/language-selector.js` - Language switcher UI

### 4. Updated Files

Files updated to include i18n:
- ✅ `frontend/js/config.js` - Added language config
- ✅ `frontend/js/ui.js` - Added translation support to toasts
- ✅ `frontend/index.html` - Added i18n scripts
- ✅ `frontend/pages/login.html` - Added i18n scripts
- ✅ `frontend/pages/patient-dashboard.html` - Added i18n scripts

## Testing the Implementation

### 1. Start the Backend

```bash
cd backend
python run.py
```

### 2. Open Frontend

Open `frontend/index.html` in a browser or start a local server:

```bash
# Using Python
cd frontend
python -m http.server 8000

# Then visit: http://localhost:8000
```

### 3. Test Language Switching

1. Look for the globe icon (🌐) in the navigation bar
2. Click the dropdown to see available languages:
   - English
   - हिंदी (Hindi)
   - తెలుగు (Telugu)
   - ಕನ್ನಡ (Kannada)
   - தமிழ் (Tamil)
3. Select a language and watch the page translate instantly
4. Refresh the page - your language preference should persist

### 4. Browser Console Testing

Open browser console (F12) and try:

```javascript
// Check current language
console.log('Current language:', I18n.currentLocale);

// Test translation
console.log('Welcome:', I18n.t('common.welcome'));

// Switch to Hindi
I18n.setLocale('hi');
console.log('Welcome in Hindi:', I18n.t('common.welcome'));

// Switch to Telugu
I18n.setLocale('te');
console.log('Welcome in Telugu:', I18n.t('common.welcome'));

// Get all supported languages
console.log('Supported:', APP_CONFIG.SUPPORTED_LANGUAGES);
```

## Adding Translations to Your Pages

### Method 1: HTML Attributes (Recommended)

```html
<!-- For text content -->
<h1 data-i18n="dashboard.welcomeBack">Welcome Back</h1>

<!-- For placeholders -->
<input type="text" 
       data-i18n-placeholder="auth.email" 
       placeholder="Email Address">

<!-- For titles -->
<button data-i18n-title="common.save" 
        title="Save">
    <i class="fas fa-save"></i>
</button>
```

### Method 2: JavaScript

```javascript
// Get translation
const welcomeText = I18n.t('common.welcome');

// With parameters
const greeting = I18n.t('messages.greeting', { 
    name: 'John' 
});

// Update element
document.getElementById('title').textContent = I18n.t('dashboard.title');

// Show translated toast
showSuccess(I18n.t('messages.loginSuccess'));
```

## Verifying Installation

Run this checklist:

- [ ] Backend starts without errors
- [ ] Frontend loads without console errors
- [ ] Language selector appears in navbar
- [ ] Can switch between all 5 languages
- [ ] Language preference persists after refresh
- [ ] Translations work on all pages
- [ ] Toast messages are translated

## Common Issues & Solutions

### Issue 1: "I18n is not defined"
**Cause**: Scripts loaded in wrong order
**Solution**: Ensure this order in HTML:
```html
<script src="js/config.js"></script>
<script src="js/translations.js"></script>
<script src="js/i18n.js"></script>
<!-- Other scripts -->
```

### Issue 2: Language selector not appearing
**Cause**: Container not found
**Solution**: Ensure page has `.navbar-nav` or `.sidebar-header` element

### Issue 3: Translations not updating
**Cause**: Elements missing data-i18n attributes
**Solution**: Add `data-i18n="translation.key"` to elements

### Issue 4: Backend locale not working
**Cause**: Flask-Babel not installed
**Solution**: Run `pip install Flask-Babel==4.0.0`

## Next Steps

1. **Add More Translations**: Edit `frontend/js/translations.js`
2. **Translate More Pages**: Add data-i18n attributes to other HTML files
3. **Backend Translation**: Use Flask-Babel's gettext() in Python code
4. **Test Thoroughly**: Check all pages in all languages

## Documentation

- **Full Implementation Guide**: `MULTI_LANGUAGE_IMPLEMENTATION.md`
- **Frontend i18n Guide**: `frontend/I18N_GUIDE.md`
- **Translation Keys**: `frontend/js/translations.js`

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all files are in correct locations
3. Ensure scripts are loaded in correct order
4. Review documentation files

---

**Congratulations!** 🎉 Your BharathMedicare application now supports 5 Indian languages!
