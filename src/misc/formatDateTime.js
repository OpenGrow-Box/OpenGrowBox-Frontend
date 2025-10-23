function formatDateTime(dateString) {
  if (!dateString) return 'Not Available';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  // Browser-Locale automatisch erkennen
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
  
  // Browser-Locale automatisch erkennen
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
  
  // Browser-Locale automatisch erkennen
  const userLocale = navigator.language || navigator.userLanguage || 'de-DE';
  
  return new Intl.DateTimeFormat(userLocale, {

    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
export {
  formatDateTime,
  formatDate,
  formatTime

}