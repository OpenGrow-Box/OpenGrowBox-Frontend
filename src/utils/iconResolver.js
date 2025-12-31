/**
 * Icon Resolver - Optimized Icon Loading
 *
 * Uses specific imports instead of wildcard imports to enable tree-shaking.
 * This dramatically reduces bundle size by only including used icons.
 */

// Import only the icons actually used in the application
import {
  FaArrowDown, FaArrowUp, FaBan, FaBell, FaBolt, FaBook, FaBullseye,
  FaCannabis, FaChartArea, FaChartBar, FaChartLine, FaCheck, FaCheckCircle,
  FaChevronDown, FaChevronRight, FaChevronUp, FaCircle, FaClipboardCheck,
  FaClipboardList, FaClock, FaCloud, FaCog, FaCogs, FaCrown, FaDatabase,
  FaDiscord, FaDownload, FaEdit, FaEllipsisH, FaExclamationCircle,
  FaExclamationTriangle, FaFlagCheckered, FaFlask, FaGift, FaHeart,
  FaHome, FaLeaf, FaLightbulb, FaLock, FaMinus, FaMobile, FaMoon,
  FaPercentage, FaPlug, FaPowerOff, FaPuzzlePiece, FaQuestionCircle,
  FaRedo, FaRobot, FaRocket, FaSave, FaSearch, FaSeedling, FaShieldAlt,
  FaSpinner, FaSquare, FaStickyNote, FaSync, FaTelegram, FaTemperatureHigh,
  FaTerminal, FaThermometerHalf, FaTimes, FaTimesCircle, FaTools, FaTrophy,
  FaWater, FaWifi, FaWrench
} from 'react-icons/fa';

import {
  FaRegCircle
} from 'react-icons/fa6';

import {
  MdAir, MdDeviceHub, MdDevices, MdLightMode, MdOutlineDashboard,
  MdOutlineMenuBook, MdOutlineWaterDrop, MdRestartAlt, MdSettings,
  MdShowChart, MdSignalWifiOff, MdStart, MdStopCircle, MdTerminal, MdTune
} from 'react-icons/md';

import {
  GiHamburger, GiIceCube, GiMoon, GiSun, GiSunrise, GiSunset, GiWateringCan
} from 'react-icons/gi';

import {
  WiHumidity, WiWindy
} from 'react-icons/wi';

// Icon registry - maps icon names to components
const ICON_REGISTRY = {
  // FontAwesome icons
  FaArrowDown, FaArrowUp, FaBan, FaBell, FaBolt, FaBook, FaBullseye,
  FaCannabis, FaChartArea, FaChartBar, FaChartLine, FaCheck, FaCheckCircle,
  FaChevronDown, FaChevronRight, FaChevronUp, FaCircle, FaClipboardCheck,
  FaClipboardList, FaClock, FaCloud, FaCog, FaCogs, FaCrown, FaDatabase,
  FaDiscord, FaDownload, FaEdit, FaEllipsisH, FaExclamationCircle,
  FaExclamationTriangle, FaFlagCheckered, FaFlask, FaGift, FaHeart,
  FaHome, FaLeaf, FaLightbulb, FaLock, FaMinus, FaMobile, FaMoon,
  FaPercentage, FaPlug, FaPowerOff, FaPuzzlePiece, FaQuestionCircle,
  FaRedo, FaRobot, FaRocket, FaSave, FaSearch, FaSeedling, FaShieldAlt,
  FaSpinner, FaSquare, FaStickyNote, FaSync, FaTelegram, FaTemperatureHigh,
  FaTerminal, FaThermometerHalf, FaTimes, FaTimesCircle, FaTools, FaTrophy,
  FaWater, FaWifi, FaWrench, FaRegCircle,
  
  // Material Design icons
  MdAir, MdDeviceHub, MdDevices, MdLightMode, MdOutlineDashboard,
  MdOutlineMenuBook, MdOutlineWaterDrop, MdRestartAlt, MdSettings,
  MdShowChart, MdSignalWifiOff, MdStart, MdStopCircle, MdTerminal, MdTune,
  
  // Game icons
  GiHamburger, GiIceCube, GiMoon, GiSun, GiSunrise, GiSunset, GiWateringCan,
  
  // Weather icons
  WiHumidity, WiWindy
};

// Common icon fallbacks for different contexts
const FALLBACK_ICONS = {
  feature: FaPuzzlePiece,
  menu: FaCircle,
  button: FaCog,
  chart: FaChartBar,
  warning: FaExclamationTriangle,
  success: FaCheck,
  error: FaTimes,
  loading: FaSpinner,
  default: FaQuestionCircle,
  weather: FaCloud,
  utility: FaWrench,
  bootstrap: FaSquare,
  ionicons: FaBolt,
};

/**
 * Resolve an icon name to a React component
 * @param {string} iconName - Icon name (e.g., "FaChartBar", "MdSettings")
 * @param {string} context - Context for fallback selection
 * @returns {React.Component} Icon component or fallback
 */
export function getIconComponent(iconName, context = 'default') {
  if (!iconName || typeof iconName !== 'string') {
    console.warn('IconResolver: Invalid icon name provided:', iconName);
    return FALLBACK_ICONS[context] || FALLBACK_ICONS.default;
  }

  // Direct lookup in registry
  const iconComponent = ICON_REGISTRY[iconName];

  if (!iconComponent) {
    console.warn('IconResolver: Icon not found in registry:', iconName);
    return FALLBACK_ICONS[context] || FALLBACK_ICONS.default;
  }

  return iconComponent;
}

/**
 * Get icon component with additional props support
 * @param {string} iconName - Icon name
 * @param {Object} props - Additional props to pass to icon
 * @param {string} context - Context for fallback
 * @returns {Function} Function that returns icon component with props
 */
export function getIconWithProps(iconName, props = {}, context = 'default') {
  const IconComponent = getIconComponent(iconName, context);
  return (additionalProps = {}) => IconComponent({ ...props, ...additionalProps });
}

/**
 * Batch resolve multiple icons
 * @param {Array<string>} iconNames - Array of icon names
 * @param {string} context - Context for fallbacks
 * @returns {Array<React.Component>} Array of icon components
 */
export function resolveIcons(iconNames, context = 'default') {
  if (!Array.isArray(iconNames)) {
    console.warn('IconResolver: resolveIcons expects an array, got:', typeof iconNames);
    return [];
  }

  return iconNames.map(iconName => getIconComponent(iconName, context));
}

/**
 * Get all available icon names
 * @returns {Array<string>} Array of available icon names
 */
export function getAvailableIcons() {
  return Object.keys(ICON_REGISTRY);
}

/**
 * Check if an icon name is valid
 * @param {string} iconName - Icon name to validate
 * @returns {boolean} True if icon exists
 */
export function isValidIcon(iconName) {
  if (!iconName || typeof iconName !== 'string') return false;
  return !!ICON_REGISTRY[iconName];
}

/**
 * Get fallback icon for a context
 * @param {string} context - Context name
 * @returns {React.Component} Fallback icon component
 */
export function getFallbackIcon(context = 'default') {
  return FALLBACK_ICONS[context] || FALLBACK_ICONS.default;
}

/**
 * Create a memoized icon resolver for performance
 * @param {string} context - Context for fallbacks
 * @returns {Function} Memoized resolver function
 */
export function createIconResolver(context = 'default') {
  const cache = new Map();

  return (iconName) => {
    if (cache.has(iconName)) {
      return cache.get(iconName);
    }

    const icon = getIconComponent(iconName, context);
    cache.set(iconName, icon);
    return icon;
  };
}

// Create commonly used resolvers
export const resolveFeatureIcon = createIconResolver('feature');
export const resolveMenuIcon = createIconResolver('menu');
export const resolveButtonIcon = createIconResolver('button');
