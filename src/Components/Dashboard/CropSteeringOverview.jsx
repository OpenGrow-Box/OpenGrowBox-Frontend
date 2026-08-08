import { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useMedium } from '../Context/MediumContext';
import { usePlantStages } from '../Context/PlantStageContext';
import { filterSensorsByRoom } from '../Cards/SliderCards/sensorClassifier';
import { parseCSMessage, isCropSteeringMessage, PHASE_INFO } from '../../misc/csMessageParser';
import { formatDateTime } from '../../misc/formatDateTime';
import DashboardChart from './DashboardChart';
import CombinedSoilChart from './CombinedSoilChart';
import { FaTint, FaBolt, FaFlask, FaThermometerHalf, FaSeedling, FaCalendar, FaClock, FaLeaf, FaArrowDown, FaArrowUp, FaBullseye, FaMoon, FaSearch, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { MdOutlineWaterDrop } from 'react-icons/md';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY = 200;

const pruneHistory = (history) => {
  const now = Date.now();
  return history
    .filter(h => {
      const t = typeof h.ts === 'number' ? h.ts : new Date(h.ts).getTime();
      return now - t < ONE_WEEK_MS;
    })
    .slice(-MAX_HISTORY);
};


// Metric configuration - from GrowLogs
const GROW_METRICS_CONFIG = {
  moisture: {
    optimal: { min: 40, max: 60 },
    warning: { min: 30, max: 70 },
    unit: '%',
    icon: <FaTint />,
    label: 'Moisture'
  },
  ec: {
    optimal: { min: 1.0, max: 2.5 },
    warning: { min: 0.5, max: 4.0 },
    unit: 'mS/cm',
    icon: <FaBolt />,
    label: 'EC'
  },
  ph: {
    optimal: { min: 5.8, max: 6.5 },
    warning: { min: 5.5, max: 7.0 },
    unit: '',
    icon: <FaFlask />,
    label: 'pH'
  },
  temperature: {
    optimal: { min: 18, max: 25 },
    warning: { min: 15, max: 30 },
    unit: '°C',
    icon: <FaThermometerHalf />,
    label: 'Temperature'
  }
};

// Status helpers - from GrowLogs
const getMetricStatus = (metric, value) => {
  if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
    return 'unknown';
  }

  const numValue = parseFloat(value);
  const config = GROW_METRICS_CONFIG[metric];

  if (!config) return 'unknown';

  if (numValue >= config.optimal.min && numValue <= config.optimal.max) {
    return 'optimal';
  }
  if (numValue >= config.warning.min && numValue <= config.warning.max) {
    return 'warning';
  }
  return 'critical';
};

const getStatusText = (status) => {
  switch (status) {
    case 'optimal': return 'Optimal';
    case 'warning': return 'In Range';
    case 'critical': return 'Out of Range';
    default: return 'No Data';
  }
};

// Short label from a soil sensor name, e.g. "Momey Soil Sensor Feuchtigkeit" -> "Momey",
// "DevSoilSensor Soil Temperature" -> "Dev", "devsoilsensor soil temperature" -> "Dev"
const getSensorLabel = (sensor) => {
  const raw = sensor?.friendlyName || sensor?.id || '';
  const cleaned = String(raw)
    .replace(/^(sensor\.)/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> "Dev SoilSensor"
    .replace(/(soil|substrate|substrat|medium)(?=[a-z])/gi, '$1 ') // "devsoilsensor" -> "dev soil sensor"
    .replace(/(sensor|probe)(?=[a-z])/gi, '$1 ') // "soilsensor" -> "soil sensor"
    .replace(/[_-]+/g, ' ')
    .replace(/\b(soil|medium|substrate|substrat|boden|probe|sensor)\b/gi, ' ')
    .replace(/\b(moisture|vwc|feuchtigkeit|feuchte|bodenfeuchte|water[ _]?content|ec|conductivity|leitfä?higkeit|leitfaehigkeit|ph|ph value|temperature|temperatur|temp)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned && cleaned.length <= 20) return cleaned;
  const idFallback = String(sensor?.id || '')
    .split('.').pop()
    .replace(/(soil|substrate|substrat|medium)(?=[a-z])/gi, '$1 ')
    .replace(/(sensor|probe)(?=[a-z])/gi, '$1 ')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(soil|medium|substrate|substrat|boden|probe|sensor)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return idFallback || 'Sensor';
};

// Phase-based targets - these should come from backend later
const PHASE_TARGETS = {
  germination: { moisture: { min: 40, max: 60 }, ec: { min: 0.6, max: 0.9 }, ph: { min: 5.8, max: 6.2 }, temperature: { min: 20, max: 24 } },
  clones: { moisture: { min: 40, max: 60 }, ec: { min: 0.8, max: 1.2 }, ph: { min: 5.8, max: 6.2 }, temperature: { min: 20, max: 24 } },
  earlyVeg: { moisture: { min: 45, max: 65 }, ec: { min: 1.0, max: 1.6 }, ph: { min: 5.8, max: 6.2 }, temperature: { min: 22, max: 26 } },
  midVeg: { moisture: { min: 45, max: 65 }, ec: { min: 1.2, max: 1.8 }, ph: { min: 5.8, max: 6.2 }, temperature: { min: 23, max: 27 } },
  lateVeg: { minVPD: 0.9, maxVPD: 1.65, minTemp: 24, maxTemp: 27, minHumidity: 55, maxHumidity: 68 },
  earlyFlower: { minVPD: 0.8, maxVPD: 1.55, minTemp: 22, maxTemp: 26, minHumidity: 55, maxHumidity: 68 },
  midFlower: { minVPD: 0.9, maxVPD: 1.7, minTemp: 21, maxTemp: 25, minHumidity: 38, maxHumidity: 52 },
  lateFlower: { minVPD: 0.9, maxVPD: 1.85, minTemp: 20, maxTemp: 26, minHumidity: 40, maxHumidity: 55 }
};

const convertStageName = (stage) => {
  const stageLower = stage?.toLowerCase().replace(/\s+/g, '');
  const map = {
    'germination': 'germination',
    'clones': 'clones',
    'earlyveg': 'earlyVeg',
    'midveg': 'midVeg',
    'lateveg': 'lateVeg',
    'earlyflower': 'earlyFlower',
    'midflower': 'midFlower',
    'lateflower': 'lateFlower'
  };
  return map[stageLower] || 'midVeg'; // Fallback
};

const CropSteeringOverview = ({ isGlobalLiveMode, globalLiveRefreshTrigger, onLiveModeChange }) => {
  const { entities, currentRoom, connection } = useHomeAssistant();
  const { mediums, currentMediumIndex, setCurrentMediumIndex, currentMedium } = useMedium();
  const { plantStages, getStageConfig } = usePlantStages();

  // Get current stage from medium
  const currentStage = useMemo(() => {
    if (!currentMedium) return 'midVeg';
    const stage = currentMedium.current_phase || currentMedium.plant_stage;
    return convertStageName(stage);
  }, [currentMedium]);

  // Get phase-based targets
  const phaseTargets = useMemo(() => {
    const stageData = plantStages?.[currentStage] || PHASE_TARGETS[currentStage];
    return {
      moisture: { 
        min: stageData?.minVPD || 30, 
        max: stageData?.maxVPD || 70,
        optimal: ((stageData?.minVPD || 30) + (stageData?.maxVPD || 70)) / 2
      },
      ec: {
        min: stageData?.minEC || 1.0,
        max: stageData?.maxEC || 2.5,
        optimal: ((stageData?.minEC || 1.0) + (stageData?.maxEC || 2.5)) / 2
      },
      ph: {
        min: stageData?.minPh || 5.8,
        max: stageData?.maxPh || 6.2,
        optimal: ((stageData?.minPh || 5.8) + (stageData?.maxPh || 6.2)) / 2
      },
      temperature: {
        min: stageData?.minTemp || 20,
        max: stageData?.maxTemp || 28,
        optimal: ((stageData?.minTemp || 20) + (stageData?.maxTemp || 28)) / 2
      }
    };
  }, [plantStages, currentStage]);

  // Enhanced sensor detection with room filtering (stabilized ref to prevent excess re-fetches)
  // Soil/medium sensor detection + room filtering (same as SoilCard)
  const [soilSensors, setSoilSensors] = useState(null);
  const prevRef = useRef(null);
  useEffect(() => {
    if (!entities) return;

    const out = [];

    Object.entries(entities).forEach(([key, entity]) => {
      if (!key.startsWith('sensor.')) return;
      const val = parseFloat(entity.state);
      if (isNaN(val)) return;

      const id = key.toLowerCase();
      const fn = (entity.attributes?.friendly_name || '').toLowerCase();
      const combined = `${id} ${fn}`;

      const isMediumContext = /soil|medium|substrate|substrat|coco|rockwool|boden|erde|ground/.test(combined);
      if (!isMediumContext) return;

      const isMoisture = /moisture|vwc|bodenfeuchte|feuchtigkeit|water_content/.test(combined);
      const isEC = /ec|conductivity|leitf/.test(combined);
      const isPH = /ph/.test(combined) && !/phase/.test(combined);
      const isTemp = /temperature|temperatur/.test(combined) && !/dew|avg|ambient/.test(combined);

      const cat = isMoisture ? 'moisture' : isEC ? 'ec' : isPH ? 'ph' : isTemp ? 'temperature' : null;
      if (!cat) return;

      out.push({
        id: key,
        category: cat,
        context: 'soil',
        value: val,
        friendlyName: entity.attributes?.friendly_name || key,
      });
    });

    // Room filter — exactly like SoilCard uses it.
    // Applied BEFORE dedupe so the current room's sensor is never lost when
    // multiple rooms have the same sensor category (e.g. soil_ec_dev vs soil_ec_flower).
    const roomFiltered = currentRoom
      ? filterSensorsByRoom(out, currentRoom)
      : out;

    const result = {};
    roomFiltered.forEach(s => {
      if (!result[s.category]) result[s.category] = [];
      if (!result[s.category].some(x => x.id === s.id)) {
        result[s.category].push({ id: s.id, value: s.value, friendlyName: s.friendlyName });
      }
    });

    const next = JSON.stringify(result);
    if (prevRef.current !== next) {
      prevRef.current = next;
      setSoilSensors(result);
    }
  }, [entities, currentRoom]);

  // Crop steering events from the LogForClient stream, stored per room.
  const [csEvents, setCsEvents] = useState({});
  const csEventsRef = useRef({});
  const csEventsPrevRef = useRef('');

  // Latest medium-status snapshot per room (from "Medium: ... Info" events).
  const [mediumStatus, setMediumStatus] = useState({});
  const mediumSnapRef = useRef({});
  const mediumSnapPrevRef = useRef('');

  // Per-medium metric history (moisture/temp/ec/ph as [ts, value] pairs) accumulated
  // from "Medium: ... Info" events. This is the authoritative per-medium data source.
  const [mediumSeries, setMediumSeries] = useState({});
  const mediumSeriesRef = useRef({});
  const mediumSeriesPrevRef = useRef('');

  // Normalize medium names so "SOIL_1" matches "soil 1"/"SOIL-1" from the switcher.
  const normalizeMediumName = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  useEffect(() => {
    if (!connection) return;

    const getRoomFromPayload = (data = {}) => {
      if (typeof data !== 'object' || data === null) return '';
      if (data.Name) return String(data.Name);
      if (data.name) return String(data.name);
      if (data.room) return String(data.room);
      if (data.Room) return String(data.Room);
      return '';
    };

    const handleEvent = (event) => {
      const data = event?.data;
      if (!data || typeof data !== 'object') return;

      const room = getRoomFromPayload(data);
      if (!room) return;

      // Medium-status snapshots ("Medium: SOIL_1 Info") - stored per MEDIUM so each
      // plant has its own status. Falls back to the room key when no medium name is sent.
      if (data.medium) {
        const msg = String(data.Message || data.message || '');
        // Grab the full name between "Medium:" and "Info"/end-of-message, so
        // "Medium: Soil 1 Info" and "Medium: SOIL_1 Info" both resolve to SOIL_1.
        const mediumNameMatch =
          msg.match(/Medium:\s*(.+?)\s*Info/i)?.[1] ||
          msg.match(/Medium:\s*(.+?)\s*$/i)?.[1];
        const mediumName = String(
          data.medium_name ||
          data.Medium ||
          mediumNameMatch ||
          room
        ).trim();
        const mediumKey = normalizeMediumName(mediumName) || normalizeMediumName(room);

        const snap = { ts: event.time_fired || Date.now(), ...data };
        const nextSnap = { ...mediumSnapRef.current, [mediumKey]: snap };
        mediumSnapRef.current = nextSnap;
        const serializedSnap = JSON.stringify(nextSnap);
        if (serializedSnap !== mediumSnapPrevRef.current) {
          mediumSnapPrevRef.current = serializedSnap;
          setMediumStatus(nextSnap);
        }

        // Accumulate per-medium metric series (authoritative values, only on change)
        const ts = new Date(event.time_fired || Date.now()).getTime();
        const prevSeries = mediumSeriesRef.current[mediumKey] || { moisture: [], temperature: [], ec: [], ph: [] };
        const nextSeries = { ...prevSeries };
        [
          ['moisture', data.medium_moisture],
          ['temperature', data.medium_temp],
          ['ec', data.medium_ec],
          ['ph', data.medium_ph],
        ].forEach(([metric, raw]) => {
          const val = parseFloat(raw);
          if (isNaN(val)) return;
          const arr = [...(prevSeries[metric] || [])];
          const last = arr[arr.length - 1];
          if (!last || last[1] !== val) {
            arr.push([ts, val]);
            if (arr.length > 200) arr.shift();
            nextSeries[metric] = arr;
          }
        });
        if (nextSeries !== prevSeries) {
          const allSeries = { ...mediumSeriesRef.current, [mediumKey]: nextSeries };
          mediumSeriesRef.current = allSeries;
          const serializedSeries = JSON.stringify(allSeries);
          if (serializedSeries !== mediumSeriesPrevRef.current) {
            mediumSeriesPrevRef.current = serializedSeries;
            setMediumSeries(allSeries);
          }
        }

        // The shot messages themselves ("CropSteering p2: Shot 2/25") carry no VWC,
        // so use the moisture from this medium snapshot as the real reading. Attach it
        // to the latest shot that has no reading yet and push it into the VWC series.
        const measuredVwc = parseFloat(data.medium_moisture);
        if (!isNaN(measuredVwc)) {
          const roomState = csEventsRef.current[room] || { history: [], lastEvent: null };
          const history = [...roomState.history];

          // Attach the reading to the most recent shot without a VWC yet (post-shot value)
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].shotNumber && history[i].vwc === null) {
              history[i] = { ...history[i], vwc: measuredVwc };
              break;
            }
          }

          // Push a VWC measurement entry, but only when the value changed so the
          // series stays clean while the medium reports a steady value.
          const lastVwcEntry = [...history].reverse().find(h => typeof h.vwc === 'number');
          if (!lastVwcEntry || lastVwcEntry.vwc !== measuredVwc) {
            history.push({
              ts: event.time_fired || Date.now(),
              phase: roomState.lastEvent?.phase || null,
              type: 'medium',
              shotNumber: null,
              maxShots: null,
              vwc: measuredVwc,
              vwcTarget: roomState.lastEvent?.vwcTarget || null,
              duration: null,
              nextInterval: null,
              dryback: null,
              message: data.medium_type ? `Medium ${data.medium_type} moisture` : 'Medium moisture',
            });
          }

          const nextState = { ...csEventsRef.current, [room]: { ...roomState, history: pruneHistory(history) } };
          csEventsRef.current = nextState;
          const serialized = JSON.stringify(nextState);
          if (serialized !== csEventsPrevRef.current) {
            csEventsPrevRef.current = serialized;
            setCsEvents(nextState);
          }
        }
        return;
      }

      const msg = String(data.Message || data.message || '');
      const isCS = data.Type === 'CSLOG' || isCropSteeringMessage(msg);
      if (!isCS) return;

      const parsed = parseCSMessage(msg);

      const structuredVwc = parseFloat(data?.medium_moisture);
      const vwc = !isNaN(structuredVwc) ? structuredVwc : parsed.vwc;

      const roomState = csEventsRef.current[room] || { history: [], lastEvent: null };

      // VWC reading before this event (used as start VWC for shots)
      const previousVwcEntry = [...roomState.history].reverse().find(h => typeof h.vwc === 'number');
      const startVwc = previousVwcEntry ? previousVwcEntry.vwc : null;

      const entry = {
        ts: new Date(event.time_fired || Date.now()).getTime(),
        phase: parsed.toPhase || parsed.phase,
        type: parsed.type,
        shotNumber: parsed.shotNumber,
        maxShots: parsed.maxShots,
        vwc,
        startVwc,
        vwcTarget: parsed.vwcTarget,
        duration: parsed.duration,
        nextInterval: parsed.nextInterval,
        dryback: parsed.dryback,
        message: msg,
      };

      const prev = roomState.lastEvent;

      // Skip exact duplicates (double event delivery / reconnect bursts)
      if (prev && prev.ts === entry.ts && prev.vwc === entry.vwc && prev.message === entry.message) return;

      const history = pruneHistory([...roomState.history, entry]);
      const nextState = { ...csEventsRef.current, [room]: { history, lastEvent: entry } };
      csEventsRef.current = nextState;

      const serialized = JSON.stringify(nextState);
      if (serialized !== csEventsPrevRef.current) {
        csEventsPrevRef.current = serialized;
        setCsEvents(nextState);
      }
    };

    let unsubscribe = null;
    connection.subscribeEvents(handleEvent, 'LogForClient').then((unsub) => {
      unsubscribe = typeof unsub === 'function' ? unsub : null;
    }).catch(() => { /* ignore */ });

    return () => {
      if (unsubscribe) {
        try { unsubscribe(); } catch { /* ignore */ }
      }
    };
  }, [connection]);

  // Latest crop steering event data for the current room (matches the selected medium's room).
  const csRoomData = useMemo(() => {
    if (!currentRoom) return null;
    const roomState = csEvents[currentRoom];
    if (!roomState) return null;

    const history = roomState.history || [];
    const withVwc = history.filter(h => typeof h.vwc === 'number');
    const current = withVwc.length ? withVwc[withVwc.length - 1].vwc : null;
    const previous = withVwc.length > 1 ? withVwc[withVwc.length - 2].vwc : null;
    const delta = (current !== null && previous !== null) ? current - previous : null;
    const vwcSeries = withVwc.slice(-10).map(h => h.vwc);

    return {
      ...(roomState.lastEvent || {}),
      current,
      previous,
      delta,
      vwcSeries,
      vwcTarget: roomState.lastEvent?.vwcTarget || phaseTargets.moisture?.max || 65,
    };
  }, [csEvents, currentRoom, phaseTargets]);

  // Completed shots (in chronological order) with their post-shot VWC reading,
  // taken from the medium-status snapshot that arrived after each shot.
  const shotHistory = useMemo(() => {
    if (!currentRoom) return [];
    const roomState = csEvents[currentRoom];
    if (!roomState?.history) return [];
    return roomState.history
      .filter(h => h.shotNumber)
      .map(h => ({ number: h.shotNumber, max: h.maxShots, vwc: h.vwc, startVwc: h.startVwc, ts: h.ts }));
  }, [csEvents, currentRoom]);

  // Latest medium-status snapshot for the SELECTED medium (matched by normalized
  // medium name, with a room-key fallback for events that carry no medium name).
  // Resolve which per-medium entry belongs to the SELECTED medium. Tries the
  // medium_name, then plant_name, then a room-key fallback, then insertion order
  // (the key order is first-seen order, which normally matches the plant list).
  const resolveSelectedMediumData = (map) => {
    if (!map) return null;
    const candidates = [
      currentMedium?.medium_name,
      currentMedium?.plant_name,
    ].map(normalizeMediumName).filter(Boolean);
    for (const key of candidates) {
      if (map[key]) return map[key];
    }
    const roomKey = normalizeMediumName(currentRoom || '');
    if (roomKey && map[roomKey]) return map[roomKey];
    const keys = Object.keys(map);
    if (keys[currentMediumIndex]) return map[keys[currentMediumIndex]];
    return null;
  };

  const csMediumData = useMemo(() =>
    resolveSelectedMediumData(mediumStatus),
  [mediumStatus, currentMedium, currentRoom, currentMediumIndex]);

  // Per-medium metric history for the SELECTED medium - authoritative chart data.
  const selectedMediumSeries = useMemo(() =>
    resolveSelectedMediumData(mediumSeries),
  [mediumSeries, currentMedium, currentRoom, currentMediumIndex]);

  // Current numeric metric values for the SELECTED medium (from its latest snapshot).
  const mediumMetrics = useMemo(() => {
    if (!csMediumData) return null;
    const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    return {
      moisture: num(csMediumData.medium_moisture),
      ec: num(csMediumData.medium_ec),
      ph: num(csMediumData.medium_ph),
      temperature: num(csMediumData.medium_temp),
    };
  }, [csMediumData]);

  // All mediums belonging to the current area (the MediumContext is room-scoped,
  // but filter by room/area field when present so only same-area mediums count).
  // Keys of all mediums present in the current area: union of the configured
  // medium names AND the keys actually seen in "Medium: ... Info" events. This
  // makes the average work even when config names don't exactly match event names.
  const areaMediumKeys = useMemo(() => {
    const keys = new Set();
    const roomNorm = normalizeMediumName(currentRoom || '');
    (mediums || []).forEach(m => {
      const k = normalizeMediumName(m.medium_name);
      if (k) keys.add(k);
    });
    Object.keys(mediumStatus).forEach(k => {
      if (k !== roomNorm) keys.add(k);
    });
    Object.keys(mediumSeries).forEach(k => {
      if (k !== roomNorm) keys.add(k);
    });
    return [...keys];
  }, [mediums, mediumStatus, mediumSeries, currentRoom]);

  // Average metrics across all mediums in the current area (latest reading each).
  // Each medium's latest value comes from its per-medium series, falling back to its
  // latest snapshot. Used for the "All Medium Avg" display.
  const areaMetricAverages = useMemo(() => {
    const acc = { moisture: [], ec: [], ph: [], temperature: [] };
    const snapField = { moisture: 'medium_moisture', ec: 'medium_ec', ph: 'medium_ph', temperature: 'medium_temp' };
    for (const key of areaMediumKeys) {
      const series = mediumSeries[key] || {};
      const snap = mediumStatus[key];
      Object.keys(acc).forEach(metric => {
        const s = series[metric] || [];
        let val = null;
        if (s.length) {
          val = s[s.length - 1][1];
        } else {
          const v = parseFloat(snap?.[snapField[metric]]);
          val = isNaN(v) ? null : v;
        }
        if (val !== null) acc[metric].push(val);
      });
    }
    const avg = list => list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
    return {
      moisture: avg(acc.moisture),
      ec: avg(acc.ec),
      ph: avg(acc.ph),
      temperature: avg(acc.temperature),
    };
  }, [areaMediumKeys, mediumSeries, mediumStatus]);

  const areaAvgVwc = areaMetricAverages.moisture;
  const areaAvgEc = areaMetricAverages.ec;
  const areaAvgPh = areaMetricAverages.ph;
  const areaAvgTemp = areaMetricAverages.temperature;
  const hasAreaAverages = Object.values(areaMetricAverages).some(v => v !== null);

  // Pick one primary sensor per category (first with a meaningful non-zero value).
  // A 0 value means the probe isn't reporting -> skip the whole metric.
  const primarySoilSensors = useMemo(() => {
    if (!soilSensors) return null;
    const primary = {};
    Object.entries(soilSensors).forEach(([category, sensors]) => {
      const list = (sensors || []).filter(s => s.value !== 0 && !isNaN(s.value));
      if (list.length === 0) return;
      primary[category] = { id: list[0].id, value: list[0].value, friendlyName: list[0].friendlyName };
    });
    return primary;
  }, [soilSensors]);

  // Charts use the HA soil sensors (room probes) + the selected medium's series.
  const hasSensors = (soilSensors && Object.keys(soilSensors).length > 0) || !!mediumMetrics;
  const hasCombinedChart =
    (hasSensors && primarySoilSensors && Object.keys(primarySoilSensors).length > 0) ||
    (selectedMediumSeries && Object.keys(selectedMediumSeries).some(k => selectedMediumSeries[k]?.length > 0));

  // Medium-only gating for the target tiles: they show ONLY the selected medium's
  // readings (never raw HA probes). A snapshot or non-empty series = medium data.
  const hasMediumData =
    !!csMediumData ||
    (selectedMediumSeries && Object.keys(selectedMediumSeries).some(k => selectedMediumSeries[k]?.length > 0));

  // Calculate progress percentage and status
  const getTargetProgress = (metric, value, min, max) => {
    if (value === null || value === undefined) return { percent: 0, status: 'unknown' };
    
    const status = getMetricStatus(metric, value);
    const range = max - min;
    const percent = Math.min(100, Math.max(0, ((value - min) / range) * 100));
    
    return { percent, status };
  };

  // Get phase info
  const getPhaseInfo = () => {
    if (!currentMedium) return null;

    const eventPhase = csRoomData?.phase;
    const eventPhaseName = eventPhase ? PHASE_INFO[eventPhase]?.name : null;
    const phase = eventPhase
      ? `P${eventPhase.slice(1)} \u00b7 ${eventPhaseName}`
      : (currentMedium.current_phase || currentMedium.plant_stage || 'Mid Veg');
    const bloomDays = currentMedium.dates?.bloomdays || 0;
    const totalBloomDays = currentMedium.dates?.breederbloomdays || 0;
    const totalDays = currentMedium.dates?.planttotaldays || 0;

    return { phase, bloomDays, totalBloomDays, totalDays };
  };

  const phaseInfo = getPhaseInfo();

  // Derived values for the Crop Steering Activity card
  const csPhase = csRoomData?.phase;
  const csPhaseInfo = csPhase ? PHASE_INFO[csPhase] : null;
  const csPhaseName = csPhaseInfo ? `P${csPhase.slice(1)} \u00b7 ${csPhaseInfo.name}` : 'Crop Steering';
  const csPhaseDesc = csPhaseInfo?.description || 'Automated adjustment';
  const csPhaseIcon = csPhase === 'p0' ? <FaSearch size={14} /> : csPhase === 'p1' ? <MdOutlineWaterDrop size={16} /> : csPhase === 'p2' ? <FaBullseye size={14} /> : csPhase === 'p3' ? <FaMoon size={14} /> : <FaSeedling size={14} />;
  // Per-medium VWC readings for the SELECTED medium - drives the VWC box so that
  // switching mediums switches the displayed values (falls back to room shot data).
  const mediumMoistureSeries = selectedMediumSeries?.moisture || [];
  const vwcCurrent = mediumMoistureSeries.length
    ? mediumMoistureSeries[mediumMoistureSeries.length - 1][1]
    : (csRoomData?.current ?? null);
  const vwcPrevious = mediumMoistureSeries.length > 1
    ? mediumMoistureSeries[mediumMoistureSeries.length - 2][1]
    : (csRoomData?.previous ?? null);
  const vwcDelta = (vwcCurrent !== null && vwcPrevious !== null) ? vwcCurrent - vwcPrevious : (csRoomData?.delta ?? null);
  const vwcTarget = csRoomData?.vwcTarget ?? phaseTargets.moisture?.max ?? 65;

  const csVwcPercent = vwcTarget
    ? Math.min(100, Math.max(0, ((vwcCurrent || 0) / vwcTarget) * 100))
    : 0;
  const csDeltaUp = (vwcDelta ?? 0) > 0;
  const csDeltaDown = (vwcDelta ?? 0) < 0;

  const renderShotDots = () => {
    if (!csRoomData?.maxShots) return null;
    const maxVisible = Math.min(csRoomData.maxShots, 15);
    const dots = [];
    for (let i = 1; i <= maxVisible; i++) {
      dots.push(
        <ShotDot key={i} $done={i <= csRoomData.shotNumber} />
      );
    }
    return dots;
  };


  // One individual chart per sensor per metric (multiple soil probes supported)
  const metricChartConfig = {
    moisture: { title: 'Soil Moisture', unit: '%', priority: 'medium' },
    ec: { title: 'Soil EC', unit: 'mS/cm', priority: 'high' },
    ph: { title: 'Soil pH', unit: 'pH', priority: 'high' },
    temperature: { title: 'Soil Temperature', unit: '°C', priority: 'medium' },
  };

  const renderSensorCharts = (metric, sensors) => {
    if (!sensors || sensors.length === 0) return null;
    // Skip sensors with a 0 / invalid value - that means the probe isn't reporting.
    const active = sensors.filter(s => s.value !== 0 && !isNaN(s.value));
    if (active.length === 0) return null;
    const cfg = metricChartConfig[metric];
    if (!cfg) return null;
    const single = active.length === 1;
    const labels = active.map(s => getSensorLabel(s));
    return active.map((s, i) => {
      // Disambiguate identical sensor labels, e.g. two "Dev" temperature probes -> "Dev 1", "Dev 2"
      const duplicates = labels.filter(l => l === labels[i]).length;
      const label = duplicates > 1 ? `${labels[i]} ${i + 1}` : labels[i];
      return (
        <DashboardChart
          key={s.id}
          sensorId={s.id}
          title={single ? cfg.title : `${cfg.title} – ${label}`}
          unit={cfg.unit}
          priority={cfg.priority}
          isGlobalLiveMode={isGlobalLiveMode}
          globalLiveRefreshTrigger={globalLiveRefreshTrigger}
          onLiveModeChange={onLiveModeChange}
        />
      );
    });
  };

  // One target tile per sensor per metric (multiple soil probes supported)
  const metricTilesConfig = {
    moisture: { label: 'Moisture', unit: '%', digits: 1 },
    ec: { label: 'EC', unit: ' mS', digits: 2 },
    ph: { label: 'pH', unit: '', digits: 1 },
    temperature: { label: 'Temperature', unit: '°C', digits: 1 },
  };

  const renderMetricTiles = (metric, sensors, icon) => {
    const cfg = metricTilesConfig[metric];
    const targets = phaseTargets[metric];
    if (!cfg || !targets) return null;

    // ONLY the selected medium's own readings. No HA-sensor fallback - switching
    // mediums must never show data that belongs to another medium or a raw probe.
    // A 0 / missing value means that sensor doesn't exist for this medium -> no card.
    const value = mediumMetrics?.[metric];
    const hasValue = value !== null && value !== undefined && !isNaN(value) && value !== 0;
    if (!hasValue) return null;

    return (
      <TargetItem key={`${metric}-medium`}>
        <TargetHeaderRow>
          <TargetIcon>{icon}</TargetIcon>
          <TargetLabel>{cfg.label}</TargetLabel>
          <TargetSensorLabel>Current · {currentMedium?.medium_name || currentMedium?.plant_name || 'Medium'}</TargetSensorLabel>
        </TargetHeaderRow>
        <TargetRow>
          <TargetValue $status={getMetricStatus(metric, value)}>
            {value.toFixed(cfg.digits)}{cfg.unit}
          </TargetValue>
        </TargetRow>
        <TargetProgressBar>
          <TargetProgressFill
            $percent={getTargetProgress(metric, value, targets.min, targets.max).percent}
            $color={getTargetProgress(metric, value, targets.min, targets.max).status === 'optimal' ? 'var(--chart-success-color)' : getTargetProgress(metric, value, targets.min, targets.max).status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'}
          />
        </TargetProgressBar>
        <TargetRow>
          <TargetRange>
            Target: {targets.min}-{targets.max}{cfg.unit}
          </TargetRange>
        </TargetRow>
      </TargetItem>
    );
  };

  // "All Medium Avg" tile - average moisture (VWC) across every medium in the area.
  const renderAreaAvgTile = () => {
    if (areaAvgVwc === null || areaAvgVwc === 0) return null;
    const targets = phaseTargets.moisture;
    if (!targets) return null;
    return (
      <TargetItem key="area-avg" $avg>
        <TargetHeaderRow>
          <TargetIcon><FaTint /></TargetIcon>
          <TargetLabel>All Medium Avg</TargetLabel>
          <TargetSensorLabel>{areaMediumKeys.length} mediums</TargetSensorLabel>
        </TargetHeaderRow>
        <TargetRow>
          <TargetValue $status={getMetricStatus('moisture', areaAvgVwc)}>
            {areaAvgVwc.toFixed(1)}%
          </TargetValue>
        </TargetRow>
        <TargetProgressBar>
          <TargetProgressFill
            $percent={getTargetProgress('moisture', areaAvgVwc, targets.min, targets.max).percent}
            $color={getTargetProgress('moisture', areaAvgVwc, targets.min, targets.max).status === 'optimal' ? 'var(--chart-success-color)' : getTargetProgress('moisture', areaAvgVwc, targets.min, targets.max).status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'}
          />
        </TargetProgressBar>
        <TargetRow>
          <TargetRange>
            Target: {targets.min}-{targets.max}%
          </TargetRange>
        </TargetRow>
      </TargetItem>
    );
  };

  return (
    <CropSteeringSection>
      <CropHeader>
        <TitleSection>
          <CropTitle>
            <FaSeedling /> Crop Steering
          </CropTitle>
          {currentRoom && (
            <CropSubtitle>Room: {currentRoom}</CropSubtitle>
          )}
        </TitleSection>
        
        <HeaderRight>
          {phaseInfo && (
            <PhaseInfo>
              <MediumBadge>
                <FaCalendar /> Phase: {phaseInfo.phase}
              </MediumBadge>
              {phaseInfo.bloomDays > 0 && (
                <MediumBadge>
                  <FaClock /> {phaseInfo.bloomDays} / {phaseInfo.totalBloomDays} Days
                </MediumBadge>
              )}
            </PhaseInfo>
          )}
          <MediumSelector>
            <MediumSelect 
              value={currentMediumIndex} 
              onChange={(e) => setCurrentMediumIndex(parseInt(e.target.value))}
            >
              {mediums?.map((medium, idx) => (
                <option key={idx} value={idx}>
                  {medium.plant_name || medium.medium_name || `Medium ${idx + 1}`}
                </option>
              ))}
            </MediumSelect>
          </MediumSelector>
        </HeaderRight>
      </CropHeader>

      {/* Targets Section */}
      <TargetCard>
        <TargetHeader>
          <TargetTitle>
            <FaLeaf /> Current Targets
            {phaseInfo && ` - ${phaseInfo.phase} Phase`}
          </TargetTitle>
        </TargetHeader>

        {hasMediumData && (
          <>
            {/* Dry-Back Info */}
            {soilSensors.moisture?.length > 0 && phaseTargets.moisture && (
              <DryBackInfo $trend="stable">
                <FaArrowDown /> Dry-Back: Calculate from history
              </DryBackInfo>
            )}

            <TargetsGrid>
              {renderAreaAvgTile()}
              {renderMetricTiles('moisture', soilSensors.moisture, <FaTint />)}
              {renderMetricTiles('ec', soilSensors.ec, <FaBolt />)}
              {renderMetricTiles('ph', soilSensors.ph, <FaFlask />)}
              {renderMetricTiles('temperature', soilSensors.temperature, <FaThermometerHalf />)}
            </TargetsGrid>
          </>
        )}
      </TargetCard>

      {/* Crop Steering Activity (from LogForClient events, matched to the selected medium's room) */}
      <ActivityCard>
        <ActivityHeader>
          <ActivityTitle>
            <FaSeedling /> Crop Steering Activity
            {currentMedium?.plant_name && (
              <ActivityMedium>{currentMedium.plant_name}</ActivityMedium>
            )}
          </ActivityTitle>
          <ActivityBadge $live={!!csRoomData}>
            {csRoomData ? <><LiveDot /> Live</> : 'Waiting'}
          </ActivityBadge>
        </ActivityHeader>

        {hasAreaAverages && (
          <AreaAverages>
            <AreaAvgTitle>
              <FaTint /> Area Averages – all mediums in {currentRoom || 'this area'}
            </AreaAvgTitle>
            <AreaAvgItems>
              <AreaAvgItem>
                <span>VWC</span>
                <b>{areaAvgVwc !== null ? `${areaAvgVwc.toFixed(1)}%` : '--'}</b>
              </AreaAvgItem>
              <AreaAvgItem>
                <span>EC</span>
                <b>{areaAvgEc !== null ? `${areaAvgEc.toFixed(2)} mS` : '--'}</b>
              </AreaAvgItem>
              <AreaAvgItem>
                <span>pH</span>
                <b>{areaAvgPh !== null ? areaAvgPh.toFixed(1) : '--'}</b>
              </AreaAvgItem>
              <AreaAvgItem>
                <span>Temp</span>
                <b>{areaAvgTemp !== null ? `${areaAvgTemp.toFixed(1)}°C` : '--'}</b>
              </AreaAvgItem>
            </AreaAvgItems>
          </AreaAverages>
        )}

        {csRoomData ? (
          <ActivityBody>
            {csRoomData.type === 'emergency' && (
              <EmergencyBanner>
                <FaExclamationTriangle size={16} />
                <div>
                  <strong>Emergency irrigation</strong>
                  {csRoomData.shotNumber && csRoomData.maxShots && (
                    <span> – Shot {csRoomData.shotNumber}/{csRoomData.maxShots}</span>
                  )}
                  <p>{csRoomData.message}</p>
                </div>
              </EmergencyBanner>
            )}

            <ActivityMainRow>
              <PhaseBox>
                <PhaseIcon>{csPhaseIcon}</PhaseIcon>
                <PhaseText>
                  <PhaseName>{csPhaseName}</PhaseName>
                  <PhaseDesc>{csPhaseDesc}</PhaseDesc>
                </PhaseText>
              </PhaseBox>

              <VwcBox>
                <VwcValue>{vwcCurrent !== null ? `${vwcCurrent.toFixed(1)}%` : '--'}</VwcValue>
                <VwcLabel>VWC</VwcLabel>
                <VwcTargetText>Target: {vwcTarget?.toFixed(1) ?? '--'}%</VwcTargetText>
                <VwcBar>
                  <VwcFill $percent={csVwcPercent} />
                </VwcBar>
              </VwcBox>

              <PrevBox>
                <PrevLabel>Previous VWC</PrevLabel>
                <PrevValue>{vwcPrevious !== null ? `${vwcPrevious.toFixed(1)}%` : '--'}</PrevValue>
                <DeltaValue $up={csDeltaUp} $down={csDeltaDown}>
                  {csDeltaUp && <FaArrowUp size={11} />}
                  {csDeltaDown && <FaArrowDown size={11} />}
                  {vwcDelta !== null
                    ? `${vwcDelta > 0 ? '+' : ''}${vwcDelta.toFixed(1)}%`
                    : '--'}
                </DeltaValue>
              </PrevBox>

              {csRoomData.shotNumber && (
                <ShotBox>
                  <ShotLabel>Shot</ShotLabel>
                  <ShotValue>{csRoomData.shotNumber}/{csRoomData.maxShots}</ShotValue>
                  <ShotDots>{renderShotDots()}</ShotDots>
                </ShotBox>
              )}
            </ActivityMainRow>

            {shotHistory.length > 0 && (
              <ShotHistory>
                <ShotHistoryHeader>
                  <ShotHistoryLabel>Shot History</ShotHistoryLabel>
                  <ShotHistoryCount>{shotHistory.length} shot{shotHistory.length > 1 ? 's' : ''}</ShotHistoryCount>
                </ShotHistoryHeader>
                <ShotHistoryList>
                  {shotHistory.map((s, i) => (
                    <ShotHistoryItem key={`${s.number}-${s.ts}`}>
                      <ShotHistoryNum>{s.number}</ShotHistoryNum>
                      <ShotHistoryStartVwc title={s.startVwc !== null ? `Start VWC: ${s.startVwc.toFixed(1)}%` : 'Start VWC: --'}>
                        {s.startVwc !== null ? `${s.startVwc.toFixed(1)}%` : '--'}
                      </ShotHistoryStartVwc>
                      <ShotHistoryArrow>→</ShotHistoryArrow>
                      <ShotHistoryVwc title={s.vwc !== null ? `End VWC: ${s.vwc.toFixed(1)}%` : 'End VWC: --'}>
                        {s.vwc !== null ? `${s.vwc.toFixed(1)}%` : '--'}
                      </ShotHistoryVwc>
                      <ShotHistoryTime>{formatDateTime(s.ts)}</ShotHistoryTime>
                    </ShotHistoryItem>
                  ))}
                </ShotHistoryList>
              </ShotHistory>
            )}

            {(csRoomData.duration || csRoomData.nextInterval || csRoomData.dryback !== null) && (
              <ActivityMetrics>
                {csRoomData.duration && (
                  <ActivityMetric>
                    <span>Duration</span>
                    <b>{csRoomData.duration}s</b>
                  </ActivityMetric>
                )}
                {csRoomData.nextInterval && (
                  <ActivityMetric>
                    <span>Next Shot</span>
                    <b>{csRoomData.nextInterval} min</b>
                  </ActivityMetric>
                )}
                {csRoomData.dryback !== null && (
                  <ActivityMetric>
                    <span>Dryback</span>
                    <b>{csRoomData.dryback.toFixed(1)}%</b>
                  </ActivityMetric>
                )}
              </ActivityMetrics>
            )}

            {csRoomData.vwcSeries.length > 0 && (
              <VwcHistory>
                <VwcHistoryLabel>VWC History (last {Math.min(2, csRoomData.vwcSeries.length)})</VwcHistoryLabel>
                <VwcHistoryValues>
                  {csRoomData.vwcSeries.slice(-2).map((v, i, arr) => (
                    <VwcHistoryValue key={i} $active={i === arr.length - 1}>
                      {v.toFixed(1)}%
                    </VwcHistoryValue>
                  ))}
                </VwcHistoryValues>
              </VwcHistory>
            )}
          </ActivityBody>
        ) : (
          <ActivityEmpty>
            Waiting for crop steering events{currentRoom ? ` for room "${currentRoom}"` : ''}...
          </ActivityEmpty>
        )}
      </ActivityCard>

      {hasSensors ? (
        <ChartGrid>
          <ChartNote>
            <FaChartLine /> Charts below are based on <strong>HA sensor history</strong> — the target tiles and averages above are based on <strong>medium events</strong>.
          </ChartNote>

          {/* Combined Soil Chart - HA sensors + the selected medium's series */}
          {hasCombinedChart && (
            <CombinedSoilChart
              soilSensors={primarySoilSensors}
              mediumSeries={selectedMediumSeries}
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={onLiveModeChange}
              chartHeight={280}
            />
          )}

          {/* Individual Charts */}
          <IndividualCharts>
            {renderSensorCharts('moisture', soilSensors.moisture)}
            {renderSensorCharts('ec', soilSensors.ec)}
            {renderSensorCharts('ph', soilSensors.ph)}
            {renderSensorCharts('temperature', soilSensors.temperature)}
          </IndividualCharts>
        </ChartGrid>
      ) : (
        <NoSensorsMessage>
          <FaSeedling className="icon" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
          <div>No soil/medium sensors found</div>
          <div className="hint">
            Looking for: moisture, vwc, ec, ph, temperature (soil/medium)
          </div>
        </NoSensorsMessage>
      )}
    </CropSteeringSection>
  );
};

const ActivityCard = styled.div`
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActivityTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--main-text-color);
`;

const ActivityMedium = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--placeholder-text-color);
  background: var(--main-bg-card-color);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
`;

const ActivityBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  ${({ $live }) => $live
    ? 'color: var(--chart-success-color); background: rgba(76, 175, 80, 0.15);'
    : 'color: var(--placeholder-text-color); background: var(--main-bg-card-color);'}
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--chart-success-color);
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const ActivityBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActivityMainRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr auto;
  gap: 0.75rem;
  align-items: stretch;

  @media (width < 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (width < 520px) {
    grid-template-columns: 1fr;
  }
`;

const PhaseBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const PhaseIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.15);
  color: var(--main-text-color);
`;

const PhaseText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const PhaseName = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--main-text-color);
`;

const PhaseDesc = styled.span`
  font-size: 0.68rem;
  color: var(--placeholder-text-color);
`;

const VwcBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  background: var(--main-bg-card-color);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
`;

const VwcValue = styled.span`
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--main-text-color);
`;

const VwcLabel = styled.span`
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--placeholder-text-color);
`;

const VwcTargetText = styled.span`
  font-size: 0.65rem;
  color: var(--placeholder-text-color);
`;

const AreaAverages = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.12), rgba(76, 175, 80, 0.08));
  border: 1px solid rgba(96, 165, 250, 0.25);
`;

const AreaAvgTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--main-text-color);
`;

const AreaAvgItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const AreaAvgItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.15rem 0.6rem;
  border-radius: 8px;
  background: var(--main-bg-card-color);

  span {
    font-size: 0.58rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--placeholder-text-color);
  }

  b {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--chart-info-color, #3b82f6);
  }
`;

const VwcBar = styled.div`
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-top: 0.2rem;
`;

const VwcFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--chart-info-color, #3b82f6), var(--chart-success-color, #4caf50));
  width: ${({ $percent }) => `${$percent}%`};
  transition: width 0.4s ease;
`;

const PrevBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  background: var(--main-bg-card-color);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
`;

const PrevLabel = styled.span`
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--placeholder-text-color);
`;

const PrevValue = styled.span`
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--main-text-color);
`;

const DeltaValue = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  ${({ $up }) => $up && 'color: var(--chart-success-color);'}
  ${({ $down }) => $down && 'color: var(--chart-error-color);'}
`;

const ShotBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  justify-content: center;
`;

const ShotLabel = styled.span`
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--placeholder-text-color);
`;

const ShotValue = styled.span`
  font-size: 1rem;
  font-weight: 800;
  color: var(--main-text-color);
`;

const ShotDots = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const ShotDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $done }) => $done ? 'var(--chart-success-color)' : 'rgba(255,255,255,0.12)'};
`;

const ShotHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const ShotHistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ShotHistoryLabel = styled.span`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--placeholder-text-color);
`;

const ShotHistoryCount = styled.span`
  font-size: 0.65rem;
  color: var(--placeholder-text-color);
`;

const ShotHistoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const ShotHistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--main-bg-card-color);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.3rem 0.55rem;
`;

const ShotHistoryNum = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--focus-color);
`;

const ShotHistoryStartVwc = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--second-text-color);
`;

const ShotHistoryArrow = styled.span`
  font-size: 0.7rem;
  color: var(--placeholder-text-color);
  opacity: 0.6;
`;

const ShotHistoryVwc = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--main-text-color);
`;

const ShotHistoryTime = styled.span`
  font-size: 0.6rem;
  color: var(--placeholder-text-color);
`;

const ActivityMetrics = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const ActivityMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--main-bg-card-color);
  border-radius: 8px;
  padding: 0.35rem 0.6rem;

  span {
    font-size: 0.65rem;
    color: var(--placeholder-text-color);
  }

  b {
    font-size: 0.8rem;
    color: var(--main-text-color);
  }
`;

const VwcHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const VwcHistoryLabel = styled.span`
  font-size: 0.65rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const VwcHistoryValues = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
`;

const VwcHistoryValue = styled.span`
  font-size: ${({ $active }) => ($active ? '1.1rem' : '0.95rem')};
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  color: ${({ $active }) => ($active ? 'var(--main-text-color)' : 'var(--second-text-color)')};
`;

const ActivityEmpty = styled.div`
  font-size: 0.75rem;
  color: var(--placeholder-text-color);
  padding: 0.5rem 0;
`;

const EmergencyBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--chart-error-color);

  > div {
    min-width: 0;
  }

  strong {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    color: var(--second-text-color);
    word-break: break-word;
  }
`;

const CropSteeringSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  padding: 1rem;
`;

const CropHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  min-height: 50px;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CropTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--main-text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CropSubtitle = styled.span`
  font-size: 0.8rem;
  color: var(--second-text-color);
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const MediumSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MediumSelect = styled.select`
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-secondary);
  color: var(--main-text-color);
  cursor: pointer;
  min-width: 150px;
  
  &:hover {
    border-color: var(--primary-accent);
  }
`;

const MediumBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--glass-bg-secondary);
  color: var(--second-text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PhaseInfo = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PhaseBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--primary-accent);
  color: white;
  display: flex;
  const align-items: center;
  gap: 0.5rem;
`;

const TargetCard = styled.div`
  background: var(--glass-bg-primary);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TargetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const TargetTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--main-text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DryBackInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: ${props => props.$trend === 'down' ? 'var(--chart-error-color)20' : props.$trend === 'up' ? 'var(--chart-warning-color)20' : 'var(--chart-success-color)20'};
  color: ${props => props.$trend === 'down' ? 'var(--chart-error-color)' : props.$trend === 'up' ? 'var(--chart-warning-color)' : 'var(--chart-success-color)'};
`;

const TargetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (width < 768px) {
    grid-template-columns: 1fr;
  }
`;

const TargetItem = styled.div`
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TargetHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TargetIcon = styled.span`
  font-size: 1rem;
`;

const TargetLabel = styled.span`
  font-size: 0.65rem;
  color: var(--placeholder-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TargetSensorLabel = styled.span`
  margin-left: auto;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--main-text-color);
  background: var(--main-bg-card-color);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
`;

const TargetRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const TargetValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.$status === 'optimal' ? 'var(--chart-success-color)' : props.$status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'};
`;

const TargetRange = styled.span`
  font-size: 0.7rem;
  color: var(--second-text-color);
`;

const TargetProgressBar = styled.div`
  height: 4px;
  background: var(--glass-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const TargetProgressFill = styled.div`
  position: absolute;
  height: 100%;
  background: ${props => props.$color || 'var(--primary-accent)'};
  border-radius: 2px;
  transition: width 0.5s ease;
  width: ${props => props.$percent}%;
`;

const ChartGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ChartNote = styled.p`
  margin: 0;
  font-size: 0.7rem;
  color: var(--placeholder-text-color);
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  strong {
    color: var(--main-text-color);
  }
`;

const IndividualCharts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 1rem;
`;

const NoSensorsMessage = styled.div`
  padding: 3rem;
  text-align: center;
  color: var(--second-text-color);
  background: var(--glass-bg-primary);
  border-radius: 16px;
  
  .icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  .hint {
    color: var(--placeholder-text-color);
    font-size: 0.8rem;
  }
`;


export default CropSteeringOverview;