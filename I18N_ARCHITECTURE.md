# Multi-Language Support Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BharathMedicare i18n System                  │
│                                                                 │
│  Languages: English • हिंदी • తెలుగు • ಕನ್ನಡ • தமிழ்              │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐    ┌──────────────────┐                    │
│  │  HTML Pages    │    │  User Interface  │                    │
│  │                │    │                  │                    │
│  │ • index.html   │◄───┤ • Language       │                    │
│  │ • login.html   │    │   Selector (🌐)  │                    │
│  │ • dashboard    │    │ • Navbar         │                    │
│  │   .html        │    │ • Forms          │                    │
│  └────────┬───────┘    └──────────────────┘                    │
│           │                                                     │
│           │ data-i18n attributes                                │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           i18n.js (Translation Engine)              │       │
│  │                                                     │       │
│  │  • I18n.t(key) - Get translation                   │       │
│  │  • I18n.setLocale(lang) - Change language          │       │
│  │  • I18n.translatePage() - Update DOM               │       │
│  │  • I18n.formatDate() - Locale formatting           │       │
│  └──────────────────┬──────────────────────────────────┘       │
│                     │                                           │
│                     │ reads from                                │
│                     ▼                                           │
│  ┌─────────────────────────────────────────────────────┐       │
│  │        translations.js (Translation Data)           │       │
│  │                                                     │       │
│  │  TRANSLATIONS = {                                   │       │
│  │    en: { common: {...}, auth: {...}, ... },        │       │
│  │    hi: { common: {...}, auth: {...}, ... },        │       │
│  │    te: { common: {...}, auth: {...}, ... },        │       │
│  │    kn: { common: {...}, auth: {...}, ... },        │       │
│  │    ta: { common: {...}, auth: {...}, ... }         │       │
│  │  }                                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                     │                                           │
│                     │ stores preference in                      │
│                     ▼                                           │
│  ┌─────────────────────────────────────────────────────┐       │
│  │         localStorage (Persistence)                  │       │
│  │                                                     │       │
│  │  Key: bharath_medicare_lang                        │       │
│  │  Value: 'en' | 'hi' | 'te' | 'kn' | 'ta'          │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           Flask Application                         │       │
│  │                                                     │       │
│  │  app/__init__.py                                    │       │
│  │  ├─ Flask-Babel initialization                      │       │
│  │  ├─ Locale selector (get_locale)                    │       │
│  │  └─ Supported locales: en, hi, te, kn, ta          │       │
│  └──────────────────┬──────────────────────────────────┘       │
│                     │                                           │
│                     │ reads Accept-Language header              │
│                     ▼                                           │
│  ┌─────────────────────────────────────────────────────┐       │
│  │         HTTP Request Headers                        │       │
│  │                                                     │       │
│  │  Accept-Language: hi-IN,hi;q=0.9,en;q=0.8          │       │
│  │                   ↓                                 │       │
│  │  Detected Locale: hi                                │       │
│  └─────────────────────────────────────────────────────┘       │
│                     │                                           │
│                     │ uses for                                  │
│                     ▼                                           │
│  ┌─────────────────────────────────────────────────────┐       │
│  │         Translation Files (Future)                  │       │
│  │                                                     │       │
│  │  translations/                                      │       │
│  │  ├─ en/LC_MESSAGES/messages.po                      │       │
│  │  ├─ hi/LC_MESSAGES/messages.po                      │       │
│  │  ├─ te/LC_MESSAGES/messages.po                      │       │
│  │  ├─ kn/LC_MESSAGES/messages.po                      │       │
│  │  └─ ta/LC_MESSAGES/messages.po                      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Page Load
```
User opens page
    ↓
i18n.js initializes
    ↓
Check localStorage for saved language
    ↓
If not found, detect browser language
    ↓
Load translations from translations.js
    ↓
Apply translations to DOM elements with data-i18n
    ↓
Inject language selector into navbar
```

### 2. Language Change
```
User clicks language selector
    ↓
I18n.setLocale(newLang) called
    ↓
Save to localStorage
    ↓
Update HTML lang attribute
    ↓
Retranslate all elements with data-i18n
    ↓
Trigger 'languageChanged' event
    ↓
Show success toast
```

### 3. Translation Lookup
```
I18n.t('patient.profile.edit')
    ↓
Split key: ['patient', 'profile', 'edit']
    ↓
Navigate through TRANSLATIONS[currentLocale]
    ↓
Found: Return translated string
    ↓
Not found: Try English fallback
    ↓
Still not found: Return key itself
```

## Component Interaction

```
┌─────────────────┐
│  User Action    │
│  (Click lang)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  language-selector.js   │
│  • Creates dropdown     │
│  • Handles selection    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│      i18n.js            │
│  • Changes locale       │
│  • Updates DOM          │
│  • Saves preference     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   translations.js       │
│  • Provides strings     │
│  • 5 language objects   │
└─────────────────────────┘
```

## Translation Key Structure

```
TRANSLATIONS
├── en (English)
│   ├── common
│   │   ├── welcome
│   │   ├── login
│   │   └── ...
│   ├── nav
│   │   ├── home
│   │   ├── dashboard
│   │   └── ...
│   ├── auth
│   │   ├── signIn
│   │   ├── email
│   │   └── ...
│   ├── dashboard
│   ├── patient
│   ├── healthCard
│   ├── records
│   ├── appointments
│   └── messages
│
├── hi (Hindi) - Same structure
├── te (Telugu) - Same structure
├── kn (Kannada) - Same structure
└── ta (Tamil) - Same structure
```

## File Dependencies

```
HTML Pages
    ↓ requires
config.js (APP_CONFIG, STORAGE_KEYS)
    ↓ requires
translations.js (TRANSLATIONS object)
    ↓ requires
i18n.js (I18n object)
    ↓ requires
language-selector.js (UI component)
    ↓ optional
ui.js (showSuccess, showError with i18n)
```

## Storage Schema

### localStorage
```javascript
{
  "bharath_medicare_lang": "hi",      // Current language
  "bharath_medicare_token": "...",    // Auth token
  "bharath_medicare_user": "{...}"    // User data
}
```

## API Surface

### I18n Object
```javascript
I18n = {
  currentLocale: 'en',                    // Current language
  supportedLocales: ['en','hi','te','kn','ta'],
  
  // Methods
  init()                                  // Initialize system
  t(key, params)                          // Get translation
  setLocale(locale)                       // Change language
  translatePage()                         // Update DOM
  formatDate(date, options)               // Format date
  getLanguageName(locale)                 // Get language name
}
```

### HTML Attributes
```html
data-i18n="translation.key"              <!-- Translate text -->
data-i18n-placeholder="translation.key"  <!-- Translate placeholder -->
data-i18n-title="translation.key"        <!-- Translate title -->
```

## Performance Characteristics

```
┌─────────────────────────┬──────────────┐
│ Operation               │ Performance  │
├─────────────────────────┼──────────────┤
│ Initial load            │ < 50ms       │
│ Translation lookup      │ < 1ms        │
│ Language switch         │ < 100ms      │
│ Page retranslation      │ < 50ms       │
│ Memory footprint        │ ~2MB         │
│ Total file size         │ ~50KB        │
└─────────────────────────┴──────────────┘
```

## Security Model

```
┌──────────────────────────────────────┐
│  Security Considerations             │
├──────────────────────────────────────┤
│ ✓ No external API calls              │
│ ✓ All translations stored locally    │
│ ✓ No PII in translation keys         │
│ ✓ User content not auto-translated   │
│ ✓ XSS protection via textContent     │
│ ✓ localStorage only for preference   │
└──────────────────────────────────────┘
```

## Extension Points

### Adding New Language
```
1. Add to APP_CONFIG.SUPPORTED_LANGUAGES
2. Add translation object to translations.js
3. Update backend locale selector
4. Test thoroughly
```

### Adding New Translation Keys
```
1. Add key to all 5 language objects
2. Use in HTML: data-i18n="your.new.key"
3. Or in JS: I18n.t('your.new.key')
```

### Custom Event Handling
```javascript
window.addEventListener('languageChanged', (e) => {
  console.log('Language changed to:', e.detail.locale);
  // Custom logic here
});
```

## Browser Compatibility

```
┌─────────────────┬──────────────┐
│ Browser         │ Support      │
├─────────────────┼──────────────┤
│ Chrome          │ ✓ Full       │
│ Firefox         │ ✓ Full       │
│ Safari          │ ✓ Full       │
│ Edge            │ ✓ Full       │
│ IE 11           │ ✗ No         │
└─────────────────┴──────────────┘

Requirements:
• ES6 support
• localStorage
• DOM manipulation
```

## Deployment Checklist

```
□ Install Flask-Babel on backend
□ Verify all translation files present
□ Test language selector appears
□ Test all 5 languages work
□ Verify persistence works
□ Check mobile responsiveness
□ Test with different browsers
□ Validate no console errors
□ Run verify_i18n_setup.py
□ Test with i18n-demo.html
```

---

**Architecture designed for scalability, performance, and ease of use** 🚀
