// Helper to format room name - shows alias if available, otherwise formats the ID
const formatRoomName = (roomId, areas = {}, entities = {}) => {
  if (!roomId) return '';
  
  // 1. Try to get alias from HASS areas
  const area = areas[roomId];
  if (area?.aliases && area.aliases.length > 0) {
    return area.aliases[0];
  }
  
  // 2. Try to get alias from select.ogb_rooms entity's options_with_alias
  const roomEntity = entities['select.ogb_rooms'];
  if (roomEntity?.attributes?.options_with_alias?.[roomId]) {
    return roomEntity.attributes.options_with_alias[roomId];
  }
  
  // 3. Fallback: format the raw ID (e.g., "dev_room" -> "Dev Room")
  return roomId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default formatRoomName;