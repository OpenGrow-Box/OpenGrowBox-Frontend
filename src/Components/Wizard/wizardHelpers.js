export const GITHUB_ISSUES_URL = 'https://github.com/OpenGrow-Box/OpenGrowBox-Frontend/issues/new'
export const PRIVATE_SUPPORT_URL = import.meta.env.VITE_SUPPORT_API_URL + '/support'
export const UI_VERSION = 'v1.1.0'
export const PLANT_CONFIG_EVENT = 'needPlantConfig'
export const PLANT_CONFIG_RESULT_EVENT = 'needPlantConfigResult'
export const SAVE_PLANT_CONFIG_EVENT = 'savePlantConfig'
export const SAVE_PLANT_CONFIG_RESULT_EVENT = 'savePlantConfigResult'

export const allSupportCategories = [
  {
    id: 'technical',
    label: 'Technical Issue',
    description: 'Private support for device, setup, or system issues',
    route: 'private',
    minPlan: 'basic',
  },
  {
    id: 'account',
    label: 'Account & Billing',
    description: 'Private support for plans, billing, and account access',
    route: 'private',
    minPlan: 'basic',
  },
  {
    id: 'feature',
    label: 'Suggest a Feature',
    description: 'Open a public GitHub idea for improvements and new functionality',
    route: 'github',
    minPlan: 'free',
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    description: 'Open a public GitHub issue for reproducible problems and errors',
    route: 'github',
    minPlan: 'free',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Private support for anything that does not fit elsewhere',
    route: 'private',
    minPlan: 'basic',
  },
]

export const getSupportRoute = (categoryId) => {
  const category = allSupportCategories.find((item) => item.id === categoryId)
  return category?.route || 'github'
}

export const getSupportCategoryLabel = (categoryId) => {
  const category = allSupportCategories.find((item) => item.id === categoryId)
  return category?.label || 'Unknown category'
}

export const buildGitHubIssueUrl = ({ categoryId, currentPlan, summary, message, expectedBehavior, actualBehavior, reproductionSteps, room }) => {
  const categoryLabel = getSupportCategoryLabel(categoryId)
  const titlePrefix = categoryId === 'feature' ? '[Feature]' : '[Bug]'
  const title = `${titlePrefix} ${summary || categoryLabel}`
  const body = [
    `## Category`,
    categoryLabel,
    '',
    `## Plan`,
    currentPlan || 'free',
    '',
    `## Room`,
    room || 'Not provided',
    '',
    `## UI Version`,
    UI_VERSION,
    '',
    `## Summary`,
    summary || categoryLabel,
    '',
    `## Description`,
    message || 'Please describe the issue or feature request.',
    '',
    `## Expected behavior`,
    expectedBehavior || 'Please describe what you expected to happen.',
    '',
    `## Actual behavior`,
    actualBehavior || 'Please describe what actually happened.',
    '',
    `## Steps to reproduce`,
    reproductionSteps || '1. \n2. \n3. ',
  ].join('\n')

  const params = new URLSearchParams({ title, body })
  return `${GITHUB_ISSUES_URL}?${params.toString()}`
}

export const formatStageName = (stage) =>
  String(stage || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (match) => match.toUpperCase())

export const createDefaultPlantStages = () => ({
  germination: { 
    minTemp: 20, maxTemp: 24, 
    minHumidity: 78, maxHumidity: 85, 
    minVPD: 0.35, maxVPD: 0.70, 
    minLight: 100, maxLight: 200,
    minEC: 0.6, maxEc: 0.9,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 400, maxCo2: 800,
  },
  clones: { 
    minTemp: 20, maxTemp: 24, 
    minHumidity: 72, maxHumidity: 80, 
    minVPD: 0.40, maxVPD: 0.85, 
    minLight: 150, maxLight: 300,
    minEC: 0.8, maxEc: 1.2,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 400, maxCo2: 800,
  },
  earlyVeg: { 
    minTemp: 22, maxTemp: 26, 
    minHumidity: 65, maxHumidity: 75, 
    minVPD: 0.60, maxVPD: 1.20, 
    minLight: 200, maxLight: 400,
    minEC: 1.0, maxEc: 1.6,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 600, maxCo2: 1000,
  },
  midVeg: { 
    minTemp: 23, maxTemp: 27, 
    minHumidity: 60, maxHumidity: 72, 
    minVPD: 0.75, maxVPD: 1.45, 
    minLight: 300, maxLight: 500,
    minEC: 1.2, maxEc: 1.8,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 600, maxCo2: 1000,
  },
  lateVeg: { 
    minTemp: 24, maxTemp: 27, 
    minHumidity: 55, maxHumidity: 68, 
    minVPD: 0.90, maxVPD: 1.65, 
    minLight: 400, maxLight: 600,
    minEC: 1.4, maxEc: 2.0,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 800, maxCo2: 1200,
  },
  earlyFlower: { 
    minTemp: 22, maxTemp: 26, 
    minHumidity: 55, maxHumidity: 68, 
    minVPD: 0.80, maxVPD: 1.55, 
    minLight: 500, maxLight: 700,
    minEC: 1.6, maxEc: 2.2,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 800, maxCo2: 1200,
  },
  midFlower: { 
    minTemp: 21, maxTemp: 25, 
    minHumidity: 48, maxHumidity: 62, 
    minVPD: 0.90, maxVPD: 1.70, 
    minLight: 600, maxLight: 800,
    minEC: 1.8, maxEc: 2.4,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 1000, maxCo2: 1500,
  },
  lateFlower: { 
    minTemp: 19, maxTemp: 24, 
    minHumidity: 42, maxHumidity: 58, 
    minVPD: 0.90, maxVPD: 1.85, 
    minLight: 400, maxLight: 600,
    minEC: 1.4, maxEc: 2.0,
    minPh: 5.8, maxPh: 6.2,
    minCo2: 800, maxCo2: 1200,
  },
})

export const REMOTE_STAGE_KEY_MAP = {
  Germination: 'germination', germination: 'germination',
  Clones: 'clones', clones: 'clones',
  EarlyVeg: 'earlyVeg', earlyVeg: 'earlyVeg',
  MidVeg: 'midVeg', midVeg: 'midVeg',
  LateVeg: 'lateVeg', lateVeg: 'lateVeg',
  EarlyFlower: 'earlyFlower', earlyFlower: 'earlyFlower',
  MidFlower: 'midFlower', midFlower: 'midFlower',
  LateFlower: 'lateFlower', lateFlower: 'lateFlower',
}

const LIGHT_INTENSITY_PRESETS = {
  low: [100, 200],
  'low to moderate': [150, 300],
  moderate: [200, 400],
  high: [300, 500],
  'very high': [400, 600],
  'moderate to low': [200, 400],
}

const LIGHT_PRESETS = {
  germination: [100, 200],
  clones: [150, 300],
  earlyVeg: [200, 400],
  midVeg: [300, 500],
  lateVeg: [400, 600],
  earlyFlower: [500, 700],
  midFlower: [600, 800],
  lateFlower: [400, 600],
}

export const normalizeLightPlantStages = (lightPlantStages) => {
  if (!lightPlantStages || typeof lightPlantStages !== 'object' || Array.isArray(lightPlantStages)) {
    return {}
  }

  return Object.entries(lightPlantStages).reduce((acc, [stageKey, stageData]) => {
    const mappedKey = REMOTE_STAGE_KEY_MAP[stageKey]
    if (!mappedKey || !stageData || typeof stageData !== 'object') {
      return acc
    }

    acc[mappedKey] = {
      minLight: stageData.min,
      maxLight: stageData.max,
      phase: stageData.phase || '',
    }
    return acc
  }, {})
}

export const mergePlantAndLightStages = (plantStages, lightPlantStages) => {
  if (!plantStages) {
    return null
  }

  const normalizedLights = normalizeLightPlantStages(lightPlantStages)
  return Object.entries(plantStages).reduce((acc, [stageKey, stageData]) => {
    const lightStage = normalizedLights[stageKey] || {}
    acc[stageKey] = {
      ...stageData,
      minLight: stageData.minLight ?? lightStage.minLight,
      maxLight: stageData.maxLight ?? lightStage.maxLight,
      lightPhase: lightStage.phase || stageData.lightPhase || '',
    }
    return acc
  }, {})
}

const normalizeStageEntry = (stageKey, stageData, fallback) => {
  const mappedKey = REMOTE_STAGE_KEY_MAP[stageKey] || REMOTE_STAGE_KEY_MAP[stageData?.key] || REMOTE_STAGE_KEY_MAP[stageData?.id]
  if (!mappedKey || !stageData) {
    return null
  }

  const temperature = stageData?.environmental?.temperature?.optimal || []
  const humidity = stageData?.environmental?.humidity?.optimal || []
  const vpd = stageData?.environmental?.vpd?.optimal || stageData?.vpdRange || []
  const lightingIntensity = String(stageData?.lighting?.intensity || '').toLowerCase()
  const [defaultMinLight, defaultMaxLight] = LIGHT_PRESETS[mappedKey] || [fallback[mappedKey].minLight, fallback[mappedKey].maxLight]
  const [minLight, maxLight] = LIGHT_INTENSITY_PRESETS[lightingIntensity] || [defaultMinLight, defaultMaxLight]

  return {
    key: mappedKey,
    value: {
      minTemp: temperature[0] ?? stageData?.minTemp ?? fallback[mappedKey].minTemp,
      maxTemp: temperature[1] ?? stageData?.maxTemp ?? fallback[mappedKey].maxTemp,
      minHumidity: humidity[0] ?? stageData?.minHumidity ?? fallback[mappedKey].minHumidity,
      maxHumidity: humidity[1] ?? stageData?.maxHumidity ?? fallback[mappedKey].maxHumidity,
      minVPD: vpd[0] ?? stageData?.minVPD ?? fallback[mappedKey].minVPD,
      maxVPD: vpd[1] ?? stageData?.maxVPD ?? fallback[mappedKey].maxVPD,
      minLight,
      maxLight,
      // EC, pH, CO2 - use from stageData or fallback
      minEC: stageData?.minEC ?? fallback[mappedKey].minEC,
      maxEc: stageData?.maxEc ?? fallback[mappedKey].maxEc,
      minPh: stageData?.minPh ?? fallback[mappedKey].minPh,
      maxPh: stageData?.maxPh ?? fallback[mappedKey].maxPh,
      minCo2: stageData?.minCo2 ?? fallback[mappedKey].minCo2,
      maxCo2: stageData?.maxCo2 ?? fallback[mappedKey].maxCo2,
    },
  }
}

export const normalizeRemotePlantStages = (payload) => {
  const fallback = createDefaultPlantStages()

  const normalizeObjectStages = (stageObject) => {
    if (!stageObject || Array.isArray(stageObject) || typeof stageObject !== 'object') {
      return null
    }
    const normalizedFromObject = Object.entries(stageObject).reduce((acc, [stageKey, stageData]) => {
      const normalizedEntry = normalizeStageEntry(stageKey, stageData, fallback)
      if (normalizedEntry) {
        acc[normalizedEntry.key] = normalizedEntry.value
      }
      return acc
    }, {})
    const stageKeys = Object.keys(fallback)
    return stageKeys.every((key) => normalizedFromObject[key]) ? normalizedFromObject : null
  }

  const directObjectMatch = normalizeObjectStages(payload)
  if (directObjectMatch) return directObjectMatch

  const extracted = Array.isArray(payload)
    ? payload
    : payload?.plantStages || payload?.data?.plantStages || payload?.data || []

  const extractedObjectMatch = normalizeObjectStages(extracted)
  if (extractedObjectMatch) return extractedObjectMatch

  if (!Array.isArray(extracted)) {
    return null
  }

  const normalized = extracted.reduce((acc, stage) => {
    const normalizedEntry = normalizeStageEntry(stage?.key || stage?.id, stage, fallback)
    if (normalizedEntry) {
      acc[normalizedEntry.key] = normalizedEntry.value
    }
    return acc
  }, {})

  return Object.keys(fallback).every((key) => normalized[key]) ? normalized : null
}
