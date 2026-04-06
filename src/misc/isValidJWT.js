const isValidToken = (token) => {
  // Check if token exists and is a non-empty string
  // Home Assistant tokens are long-lived access tokens (not JWT format)
  return token && typeof token === 'string' && token.trim().length > 0;
};

export default isValidToken;