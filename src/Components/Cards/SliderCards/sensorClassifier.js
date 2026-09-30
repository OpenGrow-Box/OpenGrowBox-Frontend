import { SENSOR_TRANSLATIONS,extractContext,shouldIgnore} from "./sensorTranslations.js";
import formatLabel from '../../../misc/formatLabel';

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

  const context = extractContext(key, category, entity.attributes?.friendly_name);

  const rawValue = parseFloat(entity.state);
  const unit = entity.attributes?.unit_of_measurement || guessUnit(category);
  const { value, displayUnit } = convertUnit(rawValue, unit, category);

  return {
    id: key,
    category,
    context,
    value,
    unit: displayUnit,
    friendlyName: formatLabel(entity.attributes?.friendly_name || key, '', entity.entity_id || key)
  };
};


// --- Helpers ---

const detectCategory = (key, name = "") => {
  const label = `${key} ${name}`.toLowerCase();
  
  // Priority order - check more specific patterns first
  const priorityOrder = [
    'dewpoint', 'vpd', 'co2', 'light', 'pressure', 'ph', 'ec', 'tds', 'oxidation', 'salinity', 'moisture', 'humidity', 'temperature'
  ];
  
  // Find all matching categories
  const matchedCategories = [];
  for (const [category, keywords] of Object.entries(SENSOR_TRANSLATIONS)) {
    if (keywords.some(w => label.includes(w))) {
      matchedCategories.push(category);
    }
  }
  
  // If no matches, return unknown
  if (matchedCategories.length === 0) return "unknown";
  
  // If only one match, return it
  if (matchedCategories.length === 1) return matchedCategories[0];
  
  // If multiple matches, use priority order
  for (const category of priorityOrder) {
    if (matchedCategories.includes(category)) {
      return category;
    }
  }
  
  // Fallback: return first match
  return matchedCategories[0];
};

const guessUnit = (category) =>
  category === "moisture" ? "%" :
  category === "humidity" ? "%" :
  category === "temperature" ? "°C" :
  category === "co2" ? "ppm" :
  category === "ph" ? "pH" :
  category === "tds" ? "ppm" :
  category === "oxidation" ? "mV" :
  category === "salinity" ? "ppt" :
  category === "ec" ? "mS/cm" : "";

const convertUnit = (value, unit, category) => {
  if (unit === "µS/cm" || unit === "μS/cm") { 
    return { value: value / 1000, displayUnit: "mS/cm" };
  }
  return { value, displayUnit: unit };
};

const isNotNumeric = (val) => isNaN(parseFloat(val));

const WATER_WORDS = /water|wasser|aqua|nähr|nahr|nutrient|lohsung|solution|tank|reservoir|hydro|bucket|behälter/i;
const TEMP_WORDS = /temp|temperatur/i;
const NON_WATER_TEMP_WORDS = /air|ambient|umgebung|indoor|intern|outside|outdoor|external|exterior|außen|aussen|avg|average|dew|canopy|leaf/i;

/**
 * Read the known room names from select.ogb_rooms
 * @param {Object} entities - HA entity map
 * @returns {Array} Lowercase room names
 */
const getKnownRooms = (entities) => {
  const options = entities?.['select.ogb_rooms']?.attributes?.options;
  if (!Array.isArray(options)) return [];
  return options.map(r => String(r).trim().toLowerCase()).filter(Boolean);
};

/**
 * Detect ORP/oxidation sensors by entity_id naming pattern.
 * Candidates without a numeric state (unavailable/unknown) are skipped so no frozen value is
 * rendered. Preference order: sensor of the current room, then a room independent sensor.
 * A sensor of another room is never used - if the current room's ORP is unavailable, the
 * caller gets an empty list and can hide the card instead of showing foreign values.
 * @param {Object} entities - HA entity map
 * @param {String} [room] - Current room name, used to scope the candidates
 * @returns {Array} Normalized oxidation sensors with context 'water'
 */
export const detectOrpSensors = (entities, room = '') => {
  const orpPattern = /(?:^|_)orp(?:_|$)|(?:^|_)oxidation(?:_|$)|waterorp/i;

  const roomLower = (room || '').trim().toLowerCase();
  const otherRooms = getKnownRooms(entities).filter(r => r !== roomLower);

  const isOwnRoom = (key) => roomLower && key.toLowerCase().includes(roomLower);
  const isOtherRoom = (key) => otherRooms.some(r => key.toLowerCase().includes(r));

  const candidates = Object.entries(entities).filter(
    ([key, entity]) =>
      key.startsWith('sensor.') &&
      entity &&
      orpPattern.test(key) &&
      !isNotNumeric(entity.state) &&
      !shouldIgnore(key, entity)
  );

  const scoped = candidates.filter(([key]) => isOwnRoom(key));
  const selected = scoped.length > 0 ? scoped : candidates.filter(([key]) => !isOtherRoom(key));

  return selected.map(([key, entity]) => ({
    id: key,
    category: 'oxidation',
    context: 'water',
    value: parseFloat(entity.state),
    unit: entity.attributes?.unit_of_measurement || 'mV',
    friendlyName: formatLabel(entity.attributes?.friendly_name || key, '', entity.entity_id || key)
  }));
};

/**
 * Detect water/nutrient solution temperature sensors by label (order independent,
 * e.g. sensor.water_temperature, sensor.temperature_water, "Wassertemperatur").
 * Needed on top of classifyAndNormalize because a temperature sensor only gets the
 * "water" context when the label literally contains a water word, and the room filter
 * drops probes whose HA device has no area assigned to the current room.
 * @param {Object} entities - HA entity map
 * @returns {Array} Normalized temperature sensors with context 'water'
 */
export const detectWaterTempSensors = (entities) => {
  return Object.entries(entities)
    .filter(([key, entity]) => {
      if (!key.startsWith("sensor.") || !entity || isNotNumeric(entity.state)) return false;
      if (shouldIgnore(key, entity)) return false;

      const label = `${key} ${entity.attributes?.friendly_name || ""}`;
      return WATER_WORDS.test(label) && TEMP_WORDS.test(label) && !NON_WATER_TEMP_WORDS.test(label);
    })
    .map(([key, entity]) => ({
      id: key,
      category: "temperature",
      context: "water",
      value: parseFloat(entity.state),
      unit: entity.attributes?.unit_of_measurement || "°C",
      friendlyName: formatLabel(entity.attributes?.friendly_name || key, "", entity.entity_id || key)
    }));
};

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
