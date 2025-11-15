# Multi-Language Support Guide

## Overview
BharathMedicare now supports 5 languages for the Indian healthcare ecosystem:
- **English (en)** - Default
- **Hindi (hi)** - हिंदी
- **Telugu (te)** - తెలుగు
- **Kannada (kn)** - ಕನ್ನಡ
- **Tamil (ta)** - தமிழ்

## Architecture

### Frontend Implementation
The i18n system is implemented using vanilla JavaScript with the following components:

1. **translations.js** - Contains all translation strings
2. **i18n.js** - Core i18n engine
3. **language-selector.js** - UI component for language switching

### Backend Implementation
Flask-Babel is integrated for backend i18n support:
- Automatic locale detection from `Accept-Language` header
- Translation directories in `backend/translations/`

## Usage

### Adding Translations to HTML

Use `data-i18n` attributes:

```html
<!-- Text content -->
<h1 data-i18n="dashboard.welcomeBack">Welcome Back</h1>

<!-- Placeholder -->
<input type="text" data-i18n-placeholder="auth.email" placeholder="Email Address">

<!-- Title attribute -->
<button data-i18n-title="common.save" title="Save">💾</button>
```

### Using Translations in JavaScript

```javascript
// Simple translation
const greeting = I18n.t('common.welcome');

// Translation with parameters
const message = I18n.t('messages.greeting', { name: 'John' });

// Change language
I18n.setLocale('hi'); // Switch to Hindi

// Get current language
const currentLang = I18n.currentLocale;

// Format date according to locale
const formattedDate = I18n.formatDate(new Date());
```

### Language Selector

The language selector is automatically injected into the navbar. It:
- Saves preference to localStorage
- Updates all translated elements on change
- Triggers `languageChanged` event for custom handlers

## Adding New Translations

### 1. Add to translations.js

```javascript
const TRANSLATIONS = {
    en: {
        mySection: {
            myKey: 'My English Text'
        }
    },
    hi: {
        mySection: {
            myKey: 'मेरा हिंदी पाठ'
        }
    },
    // ... other languages
};
```

### 2. Use in HTML

```html
<span data-i18n="mySection.myKey">My English Text</span>
```

### 3. Use in JavaScript

```javascript
const text = I18n.t('mySection.myKey');
```

## Translation Keys Structure

```
common.*          - Common UI elements (buttons, labels)
nav.*             - Navigation items
auth.*            - Authentication pages
dashboard.*       - Dashboard elements
patient.*         - Patient-specific content
healthCard.*      - Health card content
records.*         - Medical records
appointments.*    - Appointment booking
messages.*        - Success/error messages
```

## Best Practices

1. **Keep keys organized** - Use nested structure for related translations
2. **Provide fallbacks** - Always include English translation
3. **Use parameters** - For dynamic content: `{name}`, `{count}`, etc.
4. **Test all languages** - Verify UI doesn't break with longer text
5. **Cultural sensitivity** - Ensure translations are culturally appropriate

## Backend Integration

### Flask-Babel Setup

```python
from flask_babel import Babel, gettext

# In app/__init__.py
babel = Babel(app, locale_selector=get_locale)

# Use in routes
@app.route('/api/message')
def get_message():
    return jsonify({
        'message': gettext('Welcome to BharathMedicare')
    })
```

### Creating Translation Files

```bash
# Extract translatable strings
pybabel extract -F babel.cfg -o messages.pot .

# Initialize new language
pybabel init -i messages.pot -d translations -l hi

# Compile translations
pybabel compile -d translations
```

## Testing

### Manual Testing
1. Switch language using selector
2. Verify all UI elements translate
3. Check for text overflow/truncation
4. Test with different screen sizes

### Automated Testing
```javascript
// Test translation loading
console.assert(I18n.t('common.welcome') !== 'common.welcome');

// Test language switching
I18n.setLocale('hi');
console.assert(I18n.currentLocale === 'hi');
```

## Troubleshooting

### Translation not showing
- Check if key exists in translations.js
- Verify data-i18n attribute is correct
- Ensure i18n.js is loaded before use

### Language not persisting
- Check localStorage permissions
- Verify STORAGE_KEYS.LANGUAGE is set correctly

### Backend locale not detected
- Check Accept-Language header in request
- Verify Flask-Babel configuration

## Future Enhancements

1. **RTL Support** - For languages like Urdu
2. **Number Formatting** - Locale-specific number formats
3. **Currency** - INR formatting per locale
4. **Pluralization** - Handle singular/plural forms
5. **Date/Time** - More comprehensive date formatting

## Support

For issues or questions about i18n:
- Check this guide first
- Review translations.js for available keys
- Test in browser console: `I18n.t('your.key')`
