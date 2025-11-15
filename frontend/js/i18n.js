// i18n.js - Internationalization for BharathMedicare
// Supports: English, Hindi, Telugu, Kannada, Tamil

const I18n = {
    currentLocale: 'en',
    defaultLocale: 'en',
    supportedLocales: ['en', 'hi', 'te', 'kn', 'ta'],
    
    // Translation storage
    translations: {},
    
    /**
     * Initialize i18n system
     */
    init() {
        // Load saved language preference
        const savedLang = localStorage.getItem('bharath_medicare_lang');
        if (savedLang && this.supportedLocales.includes(savedLang)) {
            this.currentLocale = savedLang;
        } else {
            // Try to detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLocales.includes(browserLang)) {
                this.currentLocale = browserLang;
            }
        }
        
        // Load translations
        this.loadTranslations();
        
        // Apply translations to current page
        this.translatePage();
        
        // Update language selector if exists
        this.updateLanguageSelector();
    },
    
    /**
     * Load translation data
     */
    loadTranslations() {
        // Import translations from separate file
        if (typeof TRANSLATIONS !== 'undefined') {
            this.translations = TRANSLATIONS;
        }
    },
    
    /**
     * Get translated text
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLocale];
        
        // Navigate through nested keys
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = undefined;
                break;
            }
        }
        
        // Fallback to English if translation not found
        if (!value && this.currentLocale !== this.defaultLocale) {
            value = this.translations[this.defaultLocale];
            for (const k of keys) {
                if (value && typeof value === 'object') {
                    value = value[k];
                } else {
                    value = undefined;
                    break;
                }
            }
        }
        
        // Return key if no translation found
        if (!value) {
            return key;
        }
        
        // Replace parameters
        let result = value;
        for (const [param, val] of Object.entries(params)) {
            result = result.replace(`{${param}}`, val);
        }
        
        return result;
    },
    
    /**
     * Change language
     */
    setLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            console.warn(`Locale ${locale} not supported`);
            return;
        }
        
        this.currentLocale = locale;
        localStorage.setItem('bharath_medicare_lang', locale);
        
        // Update HTML lang attribute
        document.documentElement.lang = locale;
        
        // Retranslate page
        this.translatePage();
        
        // Update language selector
        this.updateLanguageSelector();
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale } }));
    },
    
    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLocale;
        
        // Translate elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder) {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });
        
        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Translate titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    },
    
    /**
     * Update language selector dropdown
     */
    updateLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = this.currentLocale;
        }
    },
    
    /**
     * Get language name
     */
    getLanguageName(locale) {
        const names = {
            'en': 'English',
            'hi': 'हिंदी',
            'te': 'తెలుగు',
            'kn': 'ಕನ್ನಡ',
            'ta': 'தமிழ்'
        };
        return names[locale] || locale;
    },
    
    /**
     * Format date according to locale
     */
    formatDate(date, options = {}) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const localeMap = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'te': 'te-IN',
            'kn': 'kn-IN',
            'ta': 'ta-IN'
        };
        
        const locale = localeMap[this.currentLocale] || 'en-IN';
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };
        
        return dateObj.toLocaleDateString(locale, defaultOptions);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
    I18n.init();
}
