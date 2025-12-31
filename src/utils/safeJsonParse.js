/**
 * Safe JSON parsing utilities to prevent XSS attacks and handle malformed data
 */

/**
 * Safely parse JSON string with validation and error handling
 * @param {string} str - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed object or fallback value
 */
export const safeJsonParse = (str, fallback = {}) => {
  if (typeof str !== 'string') {
    return fallback;
  }

  // Check for potentially dangerous patterns
  if (str.includes('<script') || str.includes('javascript:') || str.includes('on\w+\s*=')) {
    console.warn('Potentially dangerous content detected in JSON string');
    return fallback;
  }

  try {
    const parsed = JSON.parse(str);

    // Additional validation for expected structure
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }

    console.warn('Parsed JSON is not a valid object');
    return fallback;
  } catch (error) {
    console.warn('JSON parsing failed:', error.message);
    return fallback;
  }
};

/**
 * Safely stringify object to JSON with error handling
 * @param {any} obj - Object to stringify
 * @param {string} fallback - Fallback string if stringification fails
 * @returns {string} JSON string or fallback value
 */
export const safeJsonStringify = (obj, fallback = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON stringification failed:', error.message);
    return fallback;
  }
};

/**
 * Validate JSON structure against expected schema
 * @param {any} data - Data to validate
 * @param {object} schema - Schema definition
 * @returns {boolean} True if valid
 */
export const validateJsonStructure = (data, schema) => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Basic schema validation
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in data)) {
      return false;
    }

    if (typeof data[key] !== type) {
      return false;
    }
  }

  return true;
};