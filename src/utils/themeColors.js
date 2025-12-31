// src/utils/themeColors.js
/**
 * Utility to resolve CSS custom properties (theme variables) to actual color values
 * This is needed because canvas-based libraries like ECharts cannot use CSS variables
 */

export const getThemeColor = (variableName) => {
  try {
    // Get computed style from document root
    const rootStyles = getComputedStyle(document.documentElement);
    const colorValue = rootStyles.getPropertyValue(variableName).trim();

    // If the variable is not found or empty, return a fallback silently
    if (!colorValue) {
      return getFallbackColor(variableName);
    }

    return colorValue;
  } catch (error) {
    console.error(`Error resolving theme color ${variableName}:`, error);
    return getFallbackColor(variableName);
  }
};

export const getThemeColors = (variableNames) => {
  const colors = {};
  variableNames.forEach(varName => {
    colors[varName.replace('--', '')] = getThemeColor(varName);
  });
  return colors;
};

// Fallback colors in case CSS variables are not available
const getFallbackColor = (variableName) => {
  const fallbacks = {
    '--chart-primary-color': '#3b82f6',
    '--chart-secondary-color': '#06b6d4',
    '--chart-success-color': '#10b981',
    '--chart-warning-color': '#eab308',
    '--chart-error-color': '#ef4444',
    '--chart-neutral-color': '#6b7280',
    '--main-arrow-up': '#10b981',
    '--main-arrow-down': '#ef4444',
    '--cannabis-active-color': '#22c55e',
    '--primary-accent': '#10b981',
    '--secondary-accent': '#06b6d4'
  };

  return fallbacks[variableName] || '#666666';
};