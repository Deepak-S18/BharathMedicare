# i18n Troubleshooting Guide

## Issue: Hindi Not Showing on index.html

### Root Cause
The i18n system was properly loaded, but HTML elements needed `data-i18n` attributes to be translated.

### ✅ What Was Fixed

1. **Added data-i18n attributes to index.html:**
   - Navigation links (Home, Services, About, Contact, Login, Register)
   - Hero section (title, description, buttons)
   - Trust indicators (Active Users, Doctors, Uptime)
   - Services section header

2. **Added landing page translations:**
   - English translations in translations.js
   - Hindi translations in translations.js
   - (Telugu, Kannada, Tamil can be added similarly)

### 🧪 How to Test

#### Option 1: Test Page (Recommended)
```
Open: http://localhost/test-i18n.html
```
This page has all the data-i18n attributes properly set up and shows:
- Language selector buttons
- Multiple translation examples
- JavaScript API test

#### Option 2: Demo Page
```
Open: http://localhost/i18n-demo.html
```
Comprehensive demo with all features.

#### Option 3: Main Landing Page
```
Open: http://localhost/index.html
```
Now has translations for:
- ✅ Navigation menu
- ✅ Hero section
- ✅ Trust indicators
- ✅ Services header

### 📝 What You Should See

When you select Hindi (हिंदी):

| English | Hindi |
|---------|-------|
| Home | होम |
| Services | सेवाएं |
| Login | लॉगिन |
| Register | पंजीकरण |
| Your Health Data, Secured & Accessible | आपका स्वास्थ्य डेटा, सुरक्षित और सुलभ |
| Get Started Free | मुफ्त में शुरू करें |
| Active Users | सक्रिय उपयोगकर्ता |
| Doctors | डॉक्टर |

### 🔍 Debugging Steps

#### 1. Check if i18n is loaded
Open browser console (F12) and type:
```javascript
I18n.currentLocale
// Should show: "en" or your selected language

I18n.t('common.welcome')
// Should show: "Welcome" or translated text
```

#### 2. Check if translations exist
```javascript
I18n.t('nav.home')
// English: "Home"
// Hindi: "होम"

I18n.t('landing.heroTitle')
// English: "Your Health Data, Secured & Accessible"
// Hindi: "आपका स्वास्थ्य डेटा, सुरक्षित और सुलभ"
```

#### 3. Switch language manually
```javascript
I18n.setLocale('hi')
// Page should update immediately

I18n.setLocale('en')
// Switch back to English
```

#### 4. Check localStorage
```javascript
localStorage.getItem('bharath_medicare_lang')
// Should show your selected language: "en", "hi", etc.
```

### 🎯 Quick Fixes

#### Issue: Language selector not appearing
**Solution:** The language selector is injected by `language-selector.js`. Make sure:
1. Scripts are loaded in correct order
2. Page has `.navbar-nav` element
3. Check browser console for errors

#### Issue: Some text not translating
**Solution:** Add `data-i18n` attribute:
```html
<!-- Before -->
<span>Some Text</span>

<!-- After -->
<span data-i18n="section.key">Some Text</span>
```

#### Issue: Translation shows key instead of text
**Solution:** Add the translation to `translations.js`:
```javascript
en: {
    section: {
        key: 'English Text'
    }
},
hi: {
    section: {
        key: 'हिंदी पाठ'
    }
}
```

### 📦 Files Updated

1. **frontend/index.html**
   - Added data-i18n to navigation
   - Added data-i18n to hero section
   - Added data-i18n to trust indicators
   - Added data-i18n to services header

2. **frontend/js/translations.js**
   - Added `landing` section with translations
   - Added Hindi translations for landing page

3. **frontend/test-i18n.html** (NEW)
   - Simple test page to verify i18n works
   - Shows multiple translation examples
   - Has language selector buttons

### 🚀 Next Steps

#### For Full Translation Coverage

To translate more of index.html, add data-i18n attributes to elements:

```html
<!-- Example: Services section -->
<h3 data-i18n="services.medicalRecords">Medical Records</h3>
<p data-i18n="services.medicalRecordsDesc">Store and manage all your medical documents...</p>
```

Then add translations to `translations.js`:

```javascript
en: {
    services: {
        medicalRecords: 'Medical Records',
        medicalRecordsDesc: 'Store and manage all your medical documents...'
    }
},
hi: {
    services: {
        medicalRecords: 'मेडिकल रिकॉर्ड',
        medicalRecordsDesc: 'अपने सभी मेडिकल दस्तावेज़ों को संग्रहीत और प्रबंधित करें...'
    }
}
```

### ✅ Verification Checklist

- [ ] Open http://localhost/test-i18n.html
- [ ] Click Hindi button
- [ ] Verify text changes to Hindi
- [ ] Refresh page - language should persist
- [ ] Open http://localhost/index.html
- [ ] Look for language selector (🌐 icon)
- [ ] Select Hindi from dropdown
- [ ] Verify navigation, hero, and indicators translate
- [ ] Check browser console for errors

### 📊 Translation Coverage

| Page | Status | Notes |
|------|--------|-------|
| test-i18n.html | ✅ 100% | Test page |
| i18n-demo.html | ✅ 100% | Demo page |
| login.html | ✅ Ready | Has i18n scripts |
| patient-dashboard.html | ✅ Ready | Has i18n scripts |
| index.html | 🟡 Partial | Key elements translated |

### 🎓 Understanding the System

#### How Translation Works

1. **Page loads** → i18n.js initializes
2. **Checks localStorage** → Gets saved language preference
3. **Loads translations** → From translations.js
4. **Scans DOM** → Finds elements with `data-i18n`
5. **Applies translations** → Updates text content
6. **Injects selector** → Adds language dropdown to navbar

#### Translation Flow

```
User selects Hindi
    ↓
I18n.setLocale('hi')
    ↓
Save to localStorage
    ↓
Update HTML lang attribute
    ↓
Find all [data-i18n] elements
    ↓
Look up translation key
    ↓
Update element text
    ↓
Trigger 'languageChanged' event
```

### 💡 Pro Tips

1. **Use test-i18n.html** for quick testing
2. **Check browser console** for errors
3. **Use data-i18n attributes** for automatic translation
4. **Use I18n.t()** for JavaScript translations
5. **Test in incognito** to verify fresh load

### 🐛 Common Errors

#### Error: "I18n is not defined"
**Cause:** Scripts loaded in wrong order
**Fix:** Ensure this order:
```html
<script src="js/config.js"></script>
<script src="js/translations.js"></script>
<script src="js/i18n.js"></script>
```

#### Error: Translation shows "undefined"
**Cause:** Translation key doesn't exist
**Fix:** Add the key to translations.js for all languages

#### Error: Language selector not appearing
**Cause:** No suitable container found
**Fix:** Ensure page has `.navbar-nav` or `.sidebar-header`

### 📞 Still Having Issues?

1. Open browser console (F12)
2. Run: `python verify_i18n_setup.py`
3. Check: http://localhost/test-i18n.html
4. Review: I18N_QUICK_REFERENCE.md

---

**The i18n system is working! Just needs data-i18n attributes on elements you want to translate.** ✅
