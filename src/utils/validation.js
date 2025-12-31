/**
 * Input validation utilities for security and data integrity
 */

/**
 * Token validation
 */
export const validateToken = (token) => {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is required and must be a string' };
  }

  if (token.length < 10) {
    return { valid: false, error: 'Token is too short (minimum 10 characters)' };
  }

  if (token.length > 1000) {
    return { valid: false, error: 'Token is too long (maximum 1000 characters)' };
  }

  // Check for potentially dangerous characters
  const dangerousChars = /[<>]/;
  if (dangerousChars.test(token)) {
    return { valid: false, error: 'Token contains invalid characters' };
  }

  // Check for common token patterns (adjust based on your token format)
  const tokenPattern = /^[A-Za-z0-9\-_\.]+$/;
  if (!tokenPattern.test(token)) {
    return { valid: false, error: 'Token contains invalid characters' };
  }

  return { valid: true };
};

/**
 * Room name validation
 */
export const validateRoomName = (roomName) => {
  if (!roomName || typeof roomName !== 'string') {
    return { valid: false, error: 'Room name is required' };
  }

  if (roomName.length < 1) {
    return { valid: false, error: 'Room name cannot be empty' };
  }

  if (roomName.length > 50) {
    return { valid: false, error: 'Room name is too long (maximum 50 characters)' };
  }

  // Allow alphanumeric, spaces, hyphens, underscores
  const roomPattern = /^[A-Za-z0-9\s\-_]+$/;
  if (!roomPattern.test(roomName)) {
    return { valid: false, error: 'Room name contains invalid characters' };
  }

  return { valid: true };
};

/**
 * URL validation for Home Assistant server
 */
export const validateHassUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Home Assistant URL is required' };
  }

  try {
    const urlObj = new URL(url);

    // Must be http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Must have a hostname
    if (!urlObj.hostname) {
      return { valid: false, error: 'URL must include a valid hostname' };
    }

    // Prevent localhost in production (optional)
    if (import.meta.env.PROD && urlObj.hostname === 'localhost') {
      return { valid: false, error: 'Localhost URLs are not allowed in production' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
};

/**
 * Entity ID validation
 */
export const validateEntityId = (entityId) => {
  if (!entityId || typeof entityId !== 'string') {
    return { valid: false, error: 'Entity ID is required' };
  }

  // Home Assistant entity ID format: domain.entity_name
  const entityPattern = /^[a-z_]+\.[a-zA-Z0-9_]+$/;
  if (!entityPattern.test(entityId)) {
    return { valid: false, error: 'Invalid entity ID format (should be domain.entity_name)' };
  }

  if (entityId.length > 255) {
    return { valid: false, error: 'Entity ID is too long' };
  }

  return { valid: true };
};

/**
 * Numeric value validation with range checking
 */
export const validateNumericValue = (value, min = -Infinity, max = Infinity, required = true) => {
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { valid: false, error: 'Value is required' };
    }
    return { valid: true };
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { valid: false, error: 'Value must be a valid number' };
  }

  if (numValue < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (numValue > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }

  return { valid: true };
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous HTML/script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format (for future use)
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
};

/**
 * General input sanitization and validation
 */
export const sanitizeAndValidate = (input, type = 'string', options = {}) => {
  let sanitized = input;

  // Sanitize based on type
  switch (type) {
    case 'string':
      sanitized = sanitizeString(input);
      break;
    case 'number':
      sanitized = Number(input);
      break;
    case 'boolean':
      sanitized = Boolean(input);
      break;
    default:
      sanitized = sanitizeString(input);
  }

  // Apply type-specific validation
  switch (type) {
    case 'token':
      return validateToken(sanitized);
    case 'room':
      return validateRoomName(sanitized);
    case 'url':
      return validateHassUrl(sanitized);
    case 'entity':
      return validateEntityId(sanitized);
    case 'email':
      return validateEmail(sanitized);
    case 'number':
      return validateNumericValue(sanitized, options.min, options.max, options.required);
    default:
      return { valid: true, value: sanitized };
  }
};

export default {
  validateToken,
  validateRoomName,
  validateHassUrl,
  validateEntityId,
  validateNumericValue,
  sanitizeString,
  validateEmail,
  sanitizeAndValidate
};