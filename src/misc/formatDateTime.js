// Neue region-basierte Formatierungsfunktionen

const getRegionLocale = (region) => {
  switch (region) {
    case 'US': return 'en-US';
    case 'EU': return 'de-DE';
    default: return 'de-DE';
  }
};

// Datum & Zeit mit Region
function formatDateTimeWithRegion(dateString, region = 'EU') {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const locale = getRegionLocale(region);
  
  const options = region === 'US' 
    ? {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }
    : {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Nur Datum mit Region
function formatDateWithRegion(dateString, region = 'EU') {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const locale = getRegionLocale(region);
  
  const options = region === 'US'
    ? {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }
    : {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Nur Zeit mit Region
function formatTimeWithRegion(dateString, region = 'EU') {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const locale = getRegionLocale(region);
  
  const options = region === 'US'
    ? {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }
    : {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Format ISO-Datum für Input-Anzeige basierend auf Region
function formatDateForRegion(isoDateString, region = 'EU') {
  if (!isoDateString) return '';
  
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (region === 'US') {
      return `${month}/${day}/${year}`;
    }
    return `${day}.${month}.${year}`;
  } catch {
    return isoDateString;
  }
}

// Parse Datum aus Regional-Format zurück zu ISO
function parseDateFromRegion(displayDate, region = 'EU') {
  if (!displayDate) return '';
  
  try {
    let day, month, year;
    
    if (region === 'US') {
      // Format: MM/DD/YYYY
      [month, day, year] = displayDate.split('/');
    } else {
      // Format: DD.MM.YYYY
      [day, month, year] = displayDate.split('.');
    }
    
    if (!day || !month || !year) return displayDate;
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return displayDate;
  }
}

// Legacy Funktionen (ohne Region - nutzen Browser-Locale)
function formatDateTime(dateString) {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const userLocale = navigator.language || navigator.userLanguage || 'de-DE';
  
  return new Intl.DateTimeFormat(userLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatTime(dateString) {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const userLocale = navigator.language || navigator.userLanguage || 'de-DE';
  
  return new Intl.DateTimeFormat(userLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatDate(dateString) {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const userLocale = navigator.language || navigator.userLanguage || 'de-DE';
  
  return new Intl.DateTimeFormat(userLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export {
  // Region-basierte Funktionen
  formatDateTimeWithRegion,
  formatDateWithRegion,
  formatTimeWithRegion,
  formatDateForRegion,
  parseDateFromRegion,
  // Legacy Funktionen
  formatDateTime,
  formatDate,
  formatTime
}