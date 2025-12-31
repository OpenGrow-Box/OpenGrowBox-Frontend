/**
 * Secure token storage utilities
 * Uses sessionStorage for sensitive data (auto-cleared on tab close)
 * Includes basic encryption for additional security
 */

const STORAGE_KEY = 'ogb_secure_token';
const ENCRYPTION_KEY = 'ogb_encryption_salt'; // In production, this should be environment-specific

/**
 * Simple encryption/decryption for tokens
 * Note: This is basic obfuscation, not military-grade encryption
 */
class TokenEncryptor {
  static encrypt(token) {
    try {
      // Simple base64 encoding with salt
      const salted = token + ENCRYPTION_KEY;
      return btoa(salted);
    } catch (error) {
      console.error('Token encryption failed:', error);
      return token; // Fallback to plain token
    }
  }

  static decrypt(encryptedToken) {
    try {
      const decoded = atob(encryptedToken);
      const token = decoded.replace(ENCRYPTION_KEY, '');
      return token;
    } catch (error) {
      console.error('Token decryption failed:', error);
      return encryptedToken; // Fallback to encrypted token
    }
  }
}

/**
 * Secure token storage manager
 */
class SecureTokenStorage {
  /**
   * Store token securely
   * @param {string} token - Token to store
   */
  static storeToken(token) {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token provided to storeToken');
      return;
    }

    try {
      const encrypted = TokenEncryptor.encrypt(token);
      sessionStorage.setItem(STORAGE_KEY, encrypted);
      console.log('Token stored securely');
    } catch (error) {
      console.error('Failed to store token securely:', error);
      // Fallback to localStorage for critical functionality
      try {
        localStorage.setItem(STORAGE_KEY, token);
        console.warn('Fallback: Token stored in localStorage');
      } catch (fallbackError) {
        console.error('Critical: Unable to store token anywhere:', fallbackError);
      }
    }
  }

  /**
   * Retrieve token securely
   * @returns {string|null} Decrypted token or null if not found
   */
  static getToken() {
    try {
      // Try sessionStorage first
      let encrypted = sessionStorage.getItem(STORAGE_KEY);

      // Fallback to localStorage if not found
      if (!encrypted) {
        encrypted = localStorage.getItem(STORAGE_KEY);
        if (encrypted) {
          console.warn('Token found in insecure localStorage, migrating...');
          // Migrate to sessionStorage
          this.storeToken(encrypted);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      if (!encrypted) {
        return null;
      }

      const token = TokenEncryptor.decrypt(encrypted);

      // Basic validation
      if (token && token.length > 10) {
        return token;
      }

      console.warn('Retrieved token appears invalid');
      return null;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Clear stored token
   */
  static clearToken() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      console.log('Token cleared from all storage');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  /**
   * Check if token exists
   * @returns {boolean} True if token is stored
   */
  static hasToken() {
    return this.getToken() !== null;
  }

  /**
   * Validate token format (basic check)
   * @param {string} token - Token to validate
   * @returns {boolean} True if token format is valid
   */
  static validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic checks - adjust based on your token format
    return token.length >= 20 && /^[A-Za-z0-9\-_\.]+$/.test(token);
  }
}

export default SecureTokenStorage;