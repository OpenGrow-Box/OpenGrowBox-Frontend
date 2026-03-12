// src/utils/themeColors.js
/**
 * Utility to resolve CSS custom properties (theme variables) to actual color values
 * This is needed because canvas-based libraries like ECharts cannot use CSS variables
 */

export const getThemeColor = (variableName) => {
  try {
    const targetElement = getThemeTargetElement();
    const rootStyles = getComputedStyle(targetElement);
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

const getThemeTargetElement = () => {
  const customElement = document.querySelector('ogb-gui');

  if (customElement?.shadowRoot?.host) {
    return customElement.shadowRoot.host;
  }

  const appContainer = document.getElementById('react-container');
  if (appContainer) {
    const rootNode = appContainer.getRootNode();
    if (rootNode && rootNode !== document && rootNode.host) {
      return rootNode.host;
    }

    return appContainer;
  }

  return document.documentElement;
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
    // Main Colors
    '--primary-color': '#e2f0ff',
    '--secondary-color': '#9ae6b4',
    '--main-text-color': '#f8fbff',
    '--second-text-color': '#d2dae7',
    '--error-text-color': '#f87171',
    '--primary-accent': '#14b8a6',
    '--secondary-accent': '#60a5fa',
    '--primary-button-color': '#0f8f7f',
    '--secondary-button-color': '#2563eb',
    '--page-background': 'linear-gradient(145deg, #07101c 0%, #0d1626 46%, #1b2a3f 100%)',

    // Background Colors
    '--main-bg-color': 'rgba(7, 16, 28, 0.86)',
    '--second-bg-color': 'rgba(27, 42, 63, 0.74)',
    '--main-bg-nav-color': 'rgba(8, 15, 27, 0.95)',
    '--main-bg-card-color': 'rgba(14, 24, 40, 0.62)',
    '--main-bg-Innercard-color': 'rgba(27, 42, 63, 0.5)',
    '--glass-bg-primary': 'rgba(255, 255, 255, 0.045)',
    '--glass-bg-secondary': 'rgba(255, 255, 255, 0.025)',
    '--glass-border': 'rgba(255, 255, 255, 0.08)',
    '--glass-border-light': 'rgba(255, 255, 255, 0.14)',
    '--glass-shadow-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',

    // Unit/Value Colors
    '--main-unit-color': '#2dd4bf',
    '--second-unit-color': '#60a5fa',
    '--main-value-color': '#7dd3fc',

    // Hover/Interactive Colors
    '--main-hover-color': 'rgba(20, 184, 166, 0.14)',
    '--secondary-hover-color': 'rgba(96, 165, 250, 0.16)',
    '--clear-hover-color': 'rgba(56, 189, 248, 0.12)',

    // Status Colors
    '--warning-color': '#f59e0b',
    '--warning-text-color': '#fbbf24',
    '--warning-accent-color': '#fb923c',
    '--muted-text-color': '#9fb0c5',
    '--placeholder-text-color': '#6d8198',
    '--disabled-text-color': '#475569',
    '--focus-color': '#60a5fa',

    // Chart Colors
    '--chart-primary-color': '#60a5fa',
    '--chart-secondary-color': '#14b8a6',
    '--chart-success-color': '#22c55e',
    '--chart-warning-color': '#f59e0b',
    '--chart-error-color': '#ef4444',
    '--chart-neutral-color': '#64748b',

    // Gradient Colors
    '--main-gradient-1': 'rgba(20, 184, 166, 0.3)',
    '--main-gradient-2': 'rgba(96, 165, 250, 0.24)',
    '--main-gradient-3': 'rgba(34, 197, 94, 0.2)',
    '--main-gradient-4': 'rgba(6, 182, 212, 0.18)',
    '--main-gradient-5': 'rgba(99, 102, 241, 0.18)',

    // Sensor Colors
    '--sensor-temp-color': '#ef4444',
    '--sensor-humidity-color': '#38bdf8',
    '--sensor-co2-color': '#8b5cf6',
    '--sensor-light-color': '#fbbf24',
    '--sensor-ph-color': '#2dd4bf',
    '--sensor-ec-color': '#22c55e',

    // Arrow/Indicator Colors
    '--main-arrow-up': '#22c55e',
    '--main-arrow-down': '#ef4444',
    '--cannabis-active-color': '#22c55e',
    '--cannabis-inactive-color': '#15803d',
    
    // Border/UI Colors
    '--border-light-color': '#334155',
    '--border-color': 'rgba(255,255,255,0.08)',
    '--border-hover-color': 'rgba(255,255,255,0.14)',
    '--disabled-bg-color': 'rgba(255,255,255,0.04)',
    '--active-bg-color': 'rgba(20, 184, 166, 0.1)',
    '--pressed-bg-color': 'rgba(96, 165, 250, 0.12)',
    '--input-bg-color': 'rgba(255,255,255,0.045)',
    '--input-border-color': 'rgba(255,255,255,0.12)',
    '--button-hover-bg': 'rgba(20, 184, 166, 0.12)',
    '--input-focus-border-color': '#14b8a6',

    // Misc
    '--main-shadow-art': 'rgba(2, 6, 23, 0.48) 0px 24px 60px, rgba(20, 184, 166, 0.1) 0px 10px 24px, rgba(96, 165, 250, 0.08) 0px 2px 10px',
    '--slider-BG-color': 'linear-gradient(to right, #5eead4 0%, #14b8a6 50%, #475569 50%, #475569 100%)'
  };

  return fallbacks[variableName] || '#666666';
};
