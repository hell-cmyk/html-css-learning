/**
 * ============================================================
 * THE WALL LAB — Authentication Module (auth.js)
 * ============================================================
 * Handles admin authentication with PIN/password protection.
 * Uses sessionStorage for persistent login during browser session.
 * Supports a configurable password stored in localStorage.
 * ============================================================
 */

const AUTH_SESSION_KEY = 'thewalllab_admin_session';
const AUTH_TOKEN_KEY = 'thewalllab_admin_token';
const AUTH_PASSWORD_KEY = 'thewalllab_admin_password';
const AUTH_LOCKOUT_KEY = 'thewalllab_admin_lockout';
const AUTH_ATTEMPTS_KEY = 'thewalllab_admin_attempts';

// Default password — manager can change this from the dashboard
const DEFAULT_PASSWORD = 'admin123';

// Maximum failed attempts before temporary lockout
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60000; // 1 minute in ms

/**
 * Initialize the authentication system
 * Sets default password if none exists
 */
function initAuth() {
    if (!localStorage.getItem(AUTH_PASSWORD_KEY)) {
        // Store password as a simple hash (base64 encoded for basic obfuscation)
        // NOTE: This is NOT cryptographically secure — it's suitable for
        // a client-side localStorage demo. For production, use a real backend.
        const encoded = encodePassword(DEFAULT_PASSWORD);
        localStorage.setItem(AUTH_PASSWORD_KEY, encoded);
    }
}

/**
 * Simple password encoding (base64 + salt)
 * This is NOT real encryption — just obfuscation for localStorage
 * @param {string} password - Plain text password
 * @returns {string} Encoded password
 */
function encodePassword(password) {
    const salt = 'thewalllab_2024_';
    const combined = salt + password + salt;
    return btoa(combined);
}

/**
 * Verify a password against the stored one
 * @param {string} inputPassword - Password to verify
 * @returns {boolean} Whether the password is correct
 */
function verifyPassword(inputPassword) {
    const stored = localStorage.getItem(AUTH_PASSWORD_KEY);
    const encoded = encodePassword(inputPassword);
    return stored === encoded;
}

/**
 * Check if the admin is currently locked out due to failed attempts
 * @returns {Object} { locked: boolean, remainingSeconds: number }
 */
function checkLockout() {
    const lockoutTime = parseInt(localStorage.getItem(AUTH_LOCKOUT_KEY) || '0');
    const now = Date.now();

    if (lockoutTime > now) {
        const remaining = Math.ceil((lockoutTime - now) / 1000);
        return { locked: true, remainingSeconds: remaining };
    }

    // If lockout has expired, clear it
    if (lockoutTime > 0) {
        localStorage.removeItem(AUTH_LOCKOUT_KEY);
        localStorage.removeItem(AUTH_ATTEMPTS_KEY);
    }

    return { locked: false, remainingSeconds: 0 };
}

/**
 * Record a failed login attempt
 * @returns {Object} { attemptsLeft: number, lockedOut: boolean }
 */
function recordFailedAttempt() {
    let attempts = parseInt(localStorage.getItem(AUTH_ATTEMPTS_KEY) || '0');
    attempts++;
    localStorage.setItem(AUTH_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_ATTEMPTS) {
        // Trigger lockout
        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(AUTH_LOCKOUT_KEY, lockoutUntil.toString());
        return { attemptsLeft: 0, lockedOut: true };
    }

    return { attemptsLeft: MAX_ATTEMPTS - attempts, lockedOut: false };
}

/**
 * Clear failed attempt counter (called on successful login)
 */
function clearAttempts() {
    localStorage.removeItem(AUTH_ATTEMPTS_KEY);
    localStorage.removeItem(AUTH_LOCKOUT_KEY);
}

/**
 * Attempt to log in with a password
 * @param {string} password - Password to try
 * @returns {Object} { success: boolean, message: string, attemptsLeft?: number }
 */
function attemptLogin(password) {
    // Check lockout first
    const lockout = checkLockout();
    if (lockout.locked) {
        return {
            success: false,
            message: `Too many failed attempts. Try again in ${lockout.remainingSeconds} seconds.`,
            locked: true
        };
    }

    if (!password || password.trim() === '') {
        return { success: false, message: 'Please enter a password.' };
    }

    if (verifyPassword(password.trim())) {
        // Successful login
        clearAttempts();
        createSession();
        return { success: true, message: 'Login successful.' };
    } else {
        // Failed login
        const result = recordFailedAttempt();
        if (result.lockedOut) {
            return {
                success: false,
                message: `Too many failed attempts. Locked out for ${LOCKOUT_DURATION / 1000} seconds.`,
                locked: true
            };
        }
        return {
            success: false,
            message: `Incorrect password. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} remaining.`,
            attemptsLeft: result.attemptsLeft
        };
    }
}

/**
 * Create a session token (persists for the browser session only)
 */
function createSession() {
    // Generate a random session token
    const token = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    const sessionData = {
        token: token,
        createdAt: Date.now(),
        // Session expires after 4 hours of inactivity
        expiresAt: Date.now() + (4 * 60 * 60 * 1000)
    };

    // Store in sessionStorage (cleared when browser/tab closes)
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));

    // Also store the token reference in sessionStorage for quick validation
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Validate current session
 * @returns {boolean} Whether the current session is valid
 */
function isAuthenticated() {
    const sessionStr = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!sessionStr) return false;

    try {
        const session = JSON.parse(sessionStr);
        const now = Date.now();

        // Check if session has expired
        if (now > session.expiresAt) {
            destroySession();
            return false;
        }

        // Extend session on activity (sliding expiration)
        session.expiresAt = now + (4 * 60 * 60 * 1000);
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

        return true;
    } catch (e) {
        destroySession();
        return false;
    }
}

/**
 * Destroy the current session (logout)
 */
function destroySession() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Log out and redirect to login page
 */
function logout() {
    destroySession();
    window.location.href = 'admin-login.html';
}

/**
 * Change the admin password
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Object} { success: boolean, message: string }
 */
function changePassword(currentPassword, newPassword) {
    if (!verifyPassword(currentPassword)) {
        return { success: false, message: 'Current password is incorrect.' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
        return { success: false, message: 'New password must be at least 4 characters.' };
    }

    if (newPassword.trim().length > 32) {
        return { success: false, message: 'New password must be 32 characters or less.' };
    }

    const encoded = encodePassword(newPassword.trim());
    localStorage.setItem(AUTH_PASSWORD_KEY, encoded);

    return { success: true, message: 'Password changed successfully.' };
}

/**
 * Protect a page — call at top of admin pages
 * Redirects to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

/**
 * Get session info for display
 * @returns {Object|null} Session details or null
 */
function getSessionInfo() {
    const sessionStr = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!sessionStr) return null;

    try {
        const session = JSON.parse(sessionStr);
        const elapsed = Date.now() - session.createdAt;
        const minutes = Math.floor(elapsed / 60000);
        return {
            token: session.token.substr(0, 12) + '...',
            loginTime: new Date(session.createdAt).toLocaleTimeString(),
            minutesActive: minutes
        };
    } catch (e) {
        return null;
    }
}

// Initialize auth system
initAuth();