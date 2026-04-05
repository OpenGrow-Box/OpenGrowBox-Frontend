const STORAGE_KEY = 'opengrowbox_ai_api_keys';

const getStoredKeys = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('LocalStorage key:', STORAGE_KEY);
    console.log('Raw stored value:', stored);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error parsing localStorage:', e);
    return {};
  }
};

const setStoredKeys = (keys) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Error saving API keys:', error);
  }
};

export const saveApiKey = (provider, key) => {
  console.log('Saving API key for provider:', provider);
  console.log('Key value:', key ? key.substring(0, 10) + '...' : 'empty');
  const keys = getStoredKeys();
  keys[provider] = key;
  setStoredKeys(keys);
  console.log('Updated keys:', getStoredKeys());
};

export const getApiKey = (provider) => {
  const keys = getStoredKeys();
  const key = keys[provider] || null;
  console.log('Getting API key for:', provider, 'Has key:', !!key);
  return key;
};

export const getApiKeys = () => {
  return getStoredKeys();
};

export const hasAnyApiKey = () => {
  const keys = getStoredKeys();
  return Object.values(keys).some(key => key && key.length > 0);
};

export const getConfiguredProviders = () => {
  const keys = getStoredKeys();
  return Object.entries(keys)
    .filter(([_, key]) => key && key.length > 0)
    .map(([provider]) => provider);
};

export const removeApiKey = (provider) => {
  const keys = getStoredKeys();
  delete keys[provider];
  setStoredKeys(keys);
};