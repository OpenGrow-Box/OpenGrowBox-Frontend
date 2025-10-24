import { SENSOR_TRANSLATIONS,extractContext,shouldIgnore} from "./sensorTranslations.js";

export const classifyAndNormalize = (entities) => {
  return Object.entries(entities)
    .map(([key, entity]) => classifyEntity(key, entity))
    .filter(x => x !== null);
};

const blockedKeywords = [
  'wifi', 'mqtt', 'battery',  'power', 'connect', 'signal'
];

const classifyEntity = (key, entity) => {
  if (!key.startsWith("sensor.") || isNotNumeric(entity.state)) return null;
  if (shouldIgnore(key, entity)) return null;

  const category = detectCategory(key, entity.attributes?.friendly_name);
  
  console.log(category)
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
