export const REGIONS = {
  EU: 'EU',
  US: 'US'
};

export const REGION_INFO = {
  [REGIONS.EU]: {
    label: 'Europe',
    temperatureUnit: '°C',
    timeFormat: '24h',
    dateFormat: 'DD.MM.YYYY',
    temperatureConverter: (celsius) => celsius
  },
  [REGIONS.US]: {
    label: 'America',
    temperatureUnit: '°F',
    timeFormat: '12h',
    dateFormat: 'MM/DD/YYYY',
    temperatureConverter: (celsius) => (celsius * 9/5) + 32
  }
};

export const formatTemperature = (celsius, region = 'EU') => {
  if (celsius == null || isNaN(celsius)) return '--';
  const regionInfo = REGION_INFO[region] || REGION_INFO.EU;
  const converted = regionInfo.temperatureConverter(celsius);
  return `${Math.round(converted)}${regionInfo.temperatureUnit}`;
};

export const formatTime = (date, region = 'EU') => {
  if (!date) return '--';
  const d = new Date(date);
  const regionInfo = REGION_INFO[region] || REGION_INFO.EU;
  
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  if (regionInfo.timeFormat === '12h') {
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const formatDate = (date, region = 'EU') => {
  if (!date) return '--';
  const d = new Date(date);
  const regionInfo = REGION_INFO[region] || REGION_INFO.EU;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  switch (regionInfo.dateFormat) {
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}.${month}.${year}`;
  }
};

export const formatDateTime = (date, region = 'EU') => {
  return `${formatDate(date, region)} ${formatTime(date, region)}`;
};

// Convert a 24h time string (HH:MM or HH:MM:SS) to regional format
export const formatTimeString = (timeStr, region = 'EU') => {
  if (!timeStr || typeof timeStr !== 'string') return '--';
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const seconds = parts[2] || null;
  
  if (isNaN(hours) || isNaN(parseInt(minutes, 10))) return timeStr;
  
  if (region === 'US') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    if (seconds) {
      return `${displayHours}:${minutes}:${seconds} ${ampm}`;
    }
    return `${displayHours}:${minutes} ${ampm}`;
  }
  
  // EU format (24h)
  const paddedHours = hours.toString().padStart(2, '0');
  if (seconds) {
    return `${paddedHours}:${minutes}:${seconds}`;
  }
  return `${paddedHours}:${minutes}`;
};

// Parse a regional time string back to 24h format (HH:MM or HH:MM:SS)
export const parseTimeStringTo24h = (timeStr, region = 'EU') => {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;
  
  if (region === 'US') {
    // Parse formats like "6:00 AM", "10:30 PM", "6:00:00 AM", "10:30:00 PM"
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) return timeStr;
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] || null;
    const ampm = match[4].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    const paddedHours = hours.toString().padStart(2, '0');
    if (seconds) {
      return `${paddedHours}:${minutes}:${seconds}`;
    }
    return `${paddedHours}:${minutes}`;
  }
  
  // EU format - already in 24h, just validate
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const seconds = parts[2] || null;
  
  if (isNaN(hours) || isNaN(parseInt(minutes, 10))) return timeStr;
  
  const paddedHours = hours.toString().padStart(2, '0');
  if (seconds) {
    return `${paddedHours}:${minutes}:${seconds}`;
  }
  return `${paddedHours}:${minutes}`;
};

export const useRegion = () => {
  try {
    const GlobalContext = require('../Components/Context/GlobalContext').useGlobalState;
    const [state] = GlobalContext();
    return state.Settings?.region || 'EU';
  } catch {
    return 'EU';
  }
};