const STORAGE_KEY = 'opengrowbox_ai_api_keys';

const getStoredKeys = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
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
  const keys = getStoredKeys();
  keys[provider] = key;
  setStoredKeys(keys);
};

export const getApiKey = (provider) => {
  const keys = getStoredKeys();
  return keys[provider] || null;
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
