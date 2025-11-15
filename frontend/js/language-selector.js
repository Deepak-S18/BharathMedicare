// language-selector.js - Language selector component

/**
 * Create and inject language selector into navbar
 */
function createLanguageSelector() {
    // Check if selector already exists
    if (document.getElementById('languageSelector')) {
        return;
    }
    
    // Find navbar or suitable container
    const navbar = document.querySelector('.navbar-nav') || 
                   document.querySelector('.sidebar-header') ||
                   document.querySelector('.dashboard-header');
    
    if (!navbar) {
        console.warn('No suitable container found for language selector');
        return;
    }
    
    // Create selector container
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'language-selector-container';
    selectorContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 12px;
    `;
    
    // Create icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-globe';
    icon.style.color = 'var(--text-secondary)';
    
    // Create select element
    const select = document.createElement('select');
    select.id = 'languageSelector';
    select.className = 'language-selector';
    select.style.cssText = `
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.9rem;
        cursor: pointer;
        outline: none;
        transition: all 0.3s ease;
    `;
    
    // Add options
    APP_CONFIG.SUPPORTED_LANGUAGES.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.nativeName;
        select.appendChild(option);
    });
    
    // Set current language
    select.value = I18n.currentLocale;
    
    // Add change event
    select.addEventListener('change', (e) => {
        I18n.setLocale(e.target.value);
        showSuccess(I18n.t('messages.languageChanged') || 'Language changed successfully');
    });
    
    // Assemble and inject
    selectorContainer.appendChild(icon);
    selectorContainer.appendChild(select);
    
    // Insert before theme toggle or at end
    const themeToggle = navbar.querySelector('#themeToggle');
    if (themeToggle) {
        navbar.insertBefore(selectorContainer, themeToggle);
    } else {
        navbar.appendChild(selectorContainer);
    }
}

// Auto-create selector when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createLanguageSelector);
} else {
    createLanguageSelector();
}

// Recreate selector when language changes (for dynamic content)
window.addEventListener('languageChanged', () => {
    // Update any dynamic content that needs refresh
    console.log('Language changed to:', I18n.currentLocale);
});
