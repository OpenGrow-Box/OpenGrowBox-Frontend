import { SENSOR_TRANSLATIONS,extractContext,shouldIgnore} from "./sensorTranslations.js";

export const classifyAndNormalize = (entities) => {
  return Object.entries(entities)
    .map(([key, entity]) => classifyEntity(key, entity))
    .filter(x => x !== null);
};

const blockedKeywords = [
  'wifi', 'mqtt', 'battery',  'power', 'connect', 'signal',"backup"
];

const classifyEntity = (key, entity) => {
  if (!key.startsWith("sensor.") || isNotNumeric(entity.state)) return null;
  if (shouldIgnore(key, entity)) return null;

  const category = detectCategory(key, entity.attributes?.friendly_name);
  

  if (!category || category === "unknown") return null;

  const context = extractContext(key, category);

  const rawValue = parseFloat(entity.state);
  const unit = entity.attributes?.unit_of_measurement || guessUnit(category);
  const { value, displayUnit } = convertUnit(rawValue, unit, category);

  return {
    id: key,
    category,
    context,
    value,
    unit: displayUnit,
    friendlyName: entity.attributes?.friendly_name || key
  };
};


// --- Helpers ---

const detectCategory = (key, name = "") => {
  const label = `${key} ${name}`.toLowerCase();
  for (const [category, keywords] of Object.entries(SENSOR_TRANSLATIONS)) {
    if (keywords.some(w => label.includes(w))) return category;
  }
  return "unknown";
};

const guessUnit = (category) =>
  category === "moisture" ? "%" :
  category === "ec" ? "mS/cm" : "";

const convertUnit = (value, unit, category) => {
  if (unit === "µS/cm" || unit === "μS/cm") { 
    return { value: value / 1000, displayUnit: "mS/cm" };
  }
  return { value, displayUnit: unit };
};

const isNotNumeric = (val) => isNaN(parseFloat(val));

/**
 * Filter sensors by room using HA device registry or entity name fallback
 * @param {Array} sensors - Array of normalized sensors
 * @param {string} currentRoom - Current room name
 * @returns {Array} Filtered sensors belonging to the room
 */
export const filterSensorsByRoom = (sensors, currentRoom) => {
  if (!currentRoom) return sensors;
  
  const roomLower = currentRoom.toLowerCase();
  
  // Try HA device registry first (works in PROD)
  if (import.meta.env.PROD) {
    const HASS = document.querySelector("home-assistant")?.hass;
    const devices = HASS?.devices;
    const haEntities = HASS?.entities;
    
    if (devices && haEntities) {
      // Get all device IDs that belong to current room
      const roomDeviceIds = Object.entries(devices)
        .filter(([_, device]) => device.area_id === roomLower)
        .map(([key]) => key);
      
      // Get all entity IDs that belong to those devices
      const roomEntityIds = Object.entries(haEntities)
        .filter(([_, entity]) => roomDeviceIds.includes(entity.device_id))
        .map(([_, entity]) => entity.entity_id);
      
      // Filter sensors to only include those in the room
      return sensors.filter(s => 
        roomEntityIds.includes(s.id) || roomEntityIds.includes(s.entity_id)
      );
    }
  }
  
  // Fallback: Filter by entity ID or friendly name containing room name
  // Only filter OUT sensors that explicitly belong to OTHER rooms (OGB sensors)
  return sensors.filter(s => {
    const idLower = (s.id || s.entity_id || '').toLowerCase();
    const nameLower = (s.friendlyName || '').toLowerCase();
    
    // Check if it's an OGB sensor (has room in the name)
    const isOGBSensor = idLower.includes('ogb_');
    
    if (isOGBSensor) {
      // For OGB sensors, only show if it contains current room name
      return idLower.includes(roomLower) || nameLower.includes(roomLower);
    }
    
    // For non-OGB sensors, show all (they're not room-specific)
    return true;
  });
};
