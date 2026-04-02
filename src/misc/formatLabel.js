const formatLabel = (label, currentRoom = '', entityId = '') => {
  const roomSlug = (currentRoom || '').toLowerCase().replace(/\s+/g, '_');
  const escapedRoom = (currentRoom || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const source = String(label || entityId || '').trim();
  const objectId = String(entityId || '').includes('.')
    ? String(entityId).split('.').pop()
    : String(entityId || '');

  const normalize = (value) => String(value || '')
    .replace(/^open\s*grow\s*box\s+/i, '')
    .replace(/^ogb_/i, '')
    .replace(new RegExp(`_${roomSlug}$`, 'i'), '')
    .replace(new RegExp(`^${escapedRoom}\\s+`, 'i'), '')
    .replace(new RegExp(`${escapedRoom}$`, 'i'), '')
    .replace(/currentvpd/ig, 'current vpd')
    .replace(/avgtemperature/ig, 'avg temperature')
    .replace(/avghumidity/ig, 'avg humidity')
    .replace(/avgdewpoint/ig, 'avg dew point')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  if (objectId.toLowerCase().startsWith('ogb_')) {
    return normalize(objectId);
  }

  return normalize(source);
};


export default formatLabel
