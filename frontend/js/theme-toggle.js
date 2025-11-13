/**
 * Theme Toggle System - Dark Mode Implementation
 * Manages light/dark theme switching across the application
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'bharath_medicare_theme';
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        // Apply theme on load
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getStoredTheme() {
        return localStorage.getItem(this.THEME_KEY);
    }

    setStoredTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.updateToggleButton();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.setStoredTheme(newTheme);
    }

    updateToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                if (this.currentTheme === 'dark') {
                    icon.className = 'fas fa-sun';
                    toggleBtn.setAttribute('title', 'Switch to Light Mode');
                } else {
                    icon.className = 'fas fa-moon';
                    toggleBtn.setAttribute('title', 'Switch to Dark Mode');
                }
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Global function for toggle button
function toggleTheme() {
    themeManager.toggleTheme();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { themeManager, toggleTheme };
}
