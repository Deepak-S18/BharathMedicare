/**
 * Authentication Guard
 * Protects dashboard pages from unauthorized access
 * Must be included BEFORE other scripts on protected pages
 */

(function() {
    'use strict';
    
    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        const token = localStorage.getItem('bharath_medicare_token');
        const user = localStorage.getItem('bharath_medicare_user');
        return !!(token && user);
    }
    
    /**
     * Get current user data
     */
    function getCurrentUser() {
        try {
            const userStr = localStorage.getItem('bharath_medicare_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    
    /**
     * Check if user has required role for this page
     */
    function hasRequiredRole(requiredRole) {
        const user = getCurrentUser();
        if (!user || !user.role) {
            return false;
        }
        return user.role === requiredRole;
    }
    
    /**
     * Redirect to login page with return URL
     */
    function redirectToLogin(reason = 'not_authenticated') {
        console.log('[AuthGuard] Redirecting to login. Reason:', reason);
        
        // Prevent redirect loop - check if we're already on login page
        if (window.location.pathname.includes('login.html')) {
            console.log('[AuthGuard] Already on login page - skipping redirect');
            return;
        }
        
        // Clear any invalid session data
        localStorage.removeItem('bharath_medicare_token');
        localStorage.removeItem('bharath_medicare_user');
        localStorage.removeItem('hospital_access');
        
        // Clear the trap interval if it exists
        if (window._authTrapInterval) {
            clearInterval(window._authTrapInterval);
        }
        
        // Store the current page for redirect after login
        const currentPage = window.location.pathname;
        sessionStorage.setItem('return_url', currentPage);
        
        // Store the reason in sessionStorage to show on login page
        sessionStorage.setItem('auth_redirect_reason', reason);
        
        // Immediately redirect without showing alert
        // Alert during page load can cause blank page issues
        // The login page can show the message instead
        window.location.replace('../pages/login.html');
    }
    

    
    /**
     * Protect page - call this to enforce authentication
     * @param {string} requiredRole - Required role ('patient', 'doctor', 'admin')
     */
    function protectPage(requiredRole) {
        console.log('[AuthGuard] Protecting page with required role:', requiredRole);
        
        // Check if authenticated
        if (!isAuthenticated()) {
            console.log('[AuthGuard] User is NOT authenticated');
            redirectToLogin('not_authenticated');
            return false;
        }
        
        console.log('[AuthGuard] User is authenticated');
        
        // Check if user has required role
        if (requiredRole) {
            const user = getCurrentUser();
            console.log('[AuthGuard] Current user:', user);
            console.log('[AuthGuard] Required role:', requiredRole);
            console.log('[AuthGuard] User role:', user ? user.role : 'null');
            console.log('[AuthGuard] Has required role:', hasRequiredRole(requiredRole));
            
            if (!hasRequiredRole(requiredRole)) {
                console.log('[AuthGuard] User does NOT have required role');
                redirectToLogin('unauthorized');
                return false;
            }
        }
        
        // Setup one-time listeners for this page (only if not already set)
        if (!window._authGuardListenersSet) {
            setupAuthListeners(requiredRole);
            window._authGuardListenersSet = true;
        }
        
        console.log('[AuthGuard] Access granted');
        return true;
    }
    
    /**
     * Setup authentication listeners (called once per page load)
     * This is the UNIFIED protection system that works on every page load
     */
    function setupAuthListeners(requiredRole) {
        console.log('[AuthGuard] Setting up unified auth protection');
        
        // Mark this page as accessed while authenticated
        sessionStorage.setItem('auth_page_accessed', 'true');
        
        // UNIFIED BACK BUTTON PROTECTION
        // This works on EVERY page load, including after refresh
        let isInitialized = false;
        
        // Push one state to enable popstate detection
        history.pushState(null, null, location.href);
        
        // Set initialized flag after a short delay to avoid false triggers
        setTimeout(function() {
            isInitialized = true;
            console.log('[AuthGuard] Back button protection active');
        }, 100);
        
        // Handle any navigation attempt (back/forward button)
        window.addEventListener('popstate', function() {
            // Ignore popstate events during initialization
            if (!isInitialized) {
                console.log('[AuthGuard] Ignoring popstate during initialization');
                return;
            }
            
            console.log('[AuthGuard] Back/forward button pressed - logging out');
            
            // Immediately push state to prevent navigation
            history.pushState(null, null, location.href);
            
            // Clear session data
            localStorage.removeItem('bharath_medicare_token');
            localStorage.removeItem('bharath_medicare_user');
            localStorage.removeItem('hospital_access');
            sessionStorage.removeItem('auth_page_accessed');
            
            // Redirect to login WITHOUT alert (to avoid popup blocker)
            window.location.replace('../pages/login.html');
        });
        
        // Check on page show event (fired when navigating back via browser)
        window.addEventListener('pageshow', function(event) {
            // event.persisted is true when page is loaded from cache (back/forward)
            if (event.persisted) {
                console.log('[AuthGuard] Page loaded from cache - checking auth');
                
                // Check if user is still authenticated
                if (!isAuthenticated()) {
                    console.log('[AuthGuard] Not authenticated - redirecting');
                    sessionStorage.removeItem('auth_page_accessed');
                    window.location.replace('../pages/login.html');
                    return;
                }
                
                // Check if user has required role
                if (requiredRole && !hasRequiredRole(requiredRole)) {
                    console.log('[AuthGuard] Wrong role - redirecting');
                    sessionStorage.removeItem('auth_page_accessed');
                    window.location.replace('../pages/login.html');
                    return;
                }
                
                console.log('[AuthGuard] Auth check passed on cached page');
            }
        });
        
        // Check when page becomes visible (handles tab switching)
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // Only check if page was previously accessed while authenticated
                if (sessionStorage.getItem('auth_page_accessed') === 'true') {
                    if (!isAuthenticated() || (requiredRole && !hasRequiredRole(requiredRole))) {
                        console.log('[AuthGuard] Auth lost while page was hidden');
                        sessionStorage.removeItem('auth_page_accessed');
                        window.location.replace('../pages/login.html');
                    }
                }
            }
        });
        
        // Prevent Backspace key navigation
        document.addEventListener('keydown', function(e) {
            // Backspace key when not in an input field
            if (e.key === 'Backspace' && !isInputField(e.target)) {
                e.preventDefault();
                console.log('[AuthGuard] Backspace navigation blocked - logging out');
                
                // Clear session data
                localStorage.removeItem('bharath_medicare_token');
                localStorage.removeItem('bharath_medicare_user');
                localStorage.removeItem('hospital_access');
                sessionStorage.removeItem('auth_page_accessed');
                
                // Redirect to login
                window.location.replace('../pages/login.html');
            }
        });
    }
    
    /**
     * Prevent browser back button from accessing protected pages after logout
     */
    function preventBackAfterLogout() {
        // Check if this is a logout redirect
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('logout') === 'true') {
            // Clear history to prevent back button
            history.pushState(null, null, window.location.href);
            window.addEventListener('popstate', function() {
                history.pushState(null, null, window.location.href);
            });
        }
    }
    
    /**
     * Disable browser back button on protected pages
     * DEPRECATED: Now handled by setupAuthListeners()
     * Kept for backward compatibility
     */
    function disableBackButton() {
        console.log('[AuthGuard] disableBackButton() called - now handled by setupAuthListeners()');
        // Do nothing - protection is now in setupAuthListeners()
    }
    
    /**
     * Check if element is an input field
     */
    function isInputField(element) {
        if (!element) return false;
        const tagName = element.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || element.isContentEditable;
    }
    
    /**
     * Auto-logout on token expiration
     */
    function setupAutoLogout() {
        // Check token validity every 5 minutes
        setInterval(async function() {
            if (!isAuthenticated()) {
                return;
            }
            
            try {
                const token = localStorage.getItem('bharath_medicare_token');
                const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    // Token is invalid or expired
                    redirectToLogin('session_expired');
                }
            } catch (error) {
                console.error('Token verification error:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    /**
     * Show session timeout warning
     */
    function showSessionWarning() {
        // Show warning 5 minutes before token expires (if JWT has exp claim)
        // This is a placeholder - implement based on your JWT structure
    }
    
    // Export functions to global scope
    window.AuthGuard = {
        protectPage: protectPage,
        isAuthenticated: isAuthenticated,
        getCurrentUser: getCurrentUser,
        hasRequiredRole: hasRequiredRole,
        redirectToLogin: redirectToLogin,
        disableBackButton: disableBackButton,
        setupAutoLogout: setupAutoLogout
    };
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        preventBackAfterLogout();
    });
    
})();
