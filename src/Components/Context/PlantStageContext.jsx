import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createDefaultPlantStages, PLANT_CONFIG_EVENT, PLANT_CONFIG_RESULT_EVENT } from '../Wizard/wizardHelpers';
import { useHomeAssistant } from './HomeAssistantContext';

const PlantStageContext = createContext();

const normalizePlantStages = (data) => {
  if (!data) return null;
  if (typeof data !== 'object') return null;

  // Check for stage keys (case-insensitive)
  const dataKeys = Object.keys(data).map(k => k.toLowerCase());
  if (dataKeys.includes('germination') || dataKeys.includes('clones') || dataKeys.includes('earlyveg')) {
    return data; // Data already in correct format from HA
  }

  if (Array.isArray(data)) {
    const stageNameMap = {
      'germination': 'germination',
      'clones': 'clones',
      'clones/cuttings': 'clones',
      'early vegetative': 'earlyVeg',
      'mid vegetative': 'midVeg',
      'late vegetative': 'lateVeg',
      'early flowering': 'earlyFlower',
      'mid flowering': 'midFlower',
      'late flowering': 'lateFlower'
    };

    return data.reduce((acc, stage) => {
      const name = (stage.name || stage.id || '').toString().toLowerCase();
      const key = stageNameMap[name];
      if (key) {
        const env = stage.environmental || {};
        const temp = env.temperature?.optimal || [];
        const humidity = env.humidity?.optimal || [];
        const vpd = stage.vpdRange || stage.vpd?.optimal || env.vpd?.optimal || [];

        acc[key] = {
          minTemp: temp[0] || stage.minTemp || 20,
          maxTemp: temp[1] || stage.maxTemp || 26,
          minHumidity: humidity[0] || stage.minHumidity || 60,
          maxHumidity: humidity[1] || stage.maxHumidity || 75,
          minVPD: vpd[0] || stage.minVPD || 0.8,
          maxVPD: vpd[1] || stage.maxVPD || 1.2,
          minLight: stage.minLight || 20,
          maxLight: stage.maxLight || 100,
          minEC: stage.minEC || 0.8,
          maxEc: stage.maxEc || 1.8,
          minPh: stage.minPh || 5.8,
          maxPh: stage.maxPh || 6.2,
          minCo2: stage.minCo2 || 400,
          maxCo2: stage.maxCo2 || 1200,
        };
      }
      return acc;
    }, {});
  }

  if (data.data && Array.isArray(data.data)) {
    return normalizePlantStages(data.data);
  }

  return null;
};

const mergePlantAndLightStages = (plantStages, lightPlantStages) => {
  if (!plantStages) {
    return plantStages;
  }

  return Object.entries(plantStages).reduce((acc, [stageKey, stageData]) => {
    const lightConfig = lightPlantStages?.[stageKey];
    acc[stageKey] = {
      ...stageData,
      ...(lightConfig && {
        minLight: lightConfig.minIntensity ?? stageData.minLight,
        maxLight: lightConfig.maxIntensity ?? stageData.maxLight,
        lightOnDuration: lightConfig.onDuration ?? stageData.lightOnDuration,
        lightOffDuration: lightConfig.offDuration ?? stageData.lightOffDuration,
      }),
    };
    return acc;
  }, {});
};

export const PlantStageProvider = ({ children }) => {
  const { connection, connectionState, currentRoom } = useHomeAssistant();
  
  const [plantStages, setPlantStages] = useState(null);
  const [currentStage, setCurrentStage] = useState('germination');
  const [source, setSource] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lightPlantStages, setLightPlantStages] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const timeoutRef = useRef(null);
  const pendingRequestRef = useRef(null);
  const hasLoadedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Subscribe to plant config result events - ALWAYS active when connected
  useEffect(() => {
    if (!connection || connectionState !== 'connected') {
      setIsSubscribed(false);
      return;
    }

    const handlePlantConfigResult = (event) => {
      const data = event?.data || {};
      console.log('📥 PlantConfig Result erhalten:', JSON.stringify(data, null, 2));
      
      const requestId = data.requestId || data.request_id;
      
      if (pendingRequestRef.current && requestId === pendingRequestRef.current) {
        pendingRequestRef.current = null;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (data.success) {
          const normalizedPlantStages = mergePlantAndLightStages(
            normalizePlantStages(data.plantStages || data.plant_stages || data.data || data.result || data),
            data.lightPlantStages || data.light_plant_stages
          );
          
          // Check if we got valid data
          if (normalizedPlantStages && Object.keys(normalizedPlantStages).length > 0) {
            setPlantStages(normalizedPlantStages);
            setSource(data.activeSource || 'ha');
            setError(null);
            hasLoadedRef.current = true;
            console.log('✅ Plant stages loaded from HA:', normalizedPlantStages);
          } else {
            console.log('⚠️ HA response but no stages:', data.plantStages);
            setError('No plant stages in HA response');
            setPlantStages(createDefaultPlantStages());
            setSource('default');
          }
        } else {
          setError(data.error || 'Failed to load plant stages from HA');
          setPlantStages(createDefaultPlantStages());
          setSource('default');
        }
        setLoading(false);
      }
    };

    const unsubscribe = connection.subscribeEvents(handlePlantConfigResult, PLANT_CONFIG_RESULT_EVENT);
    setIsSubscribed(true);

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      setIsSubscribed(false);
    };
  }, [connection, connectionState]);

  // Manually trigger load - components call this when they need stages
  const requestPlantStages = useCallback(async (room = null, mode = 'default') => {
    if (connectionState !== 'connected') {
      setError('No Home Assistant connection');
      setPlantStages(createDefaultPlantStages());
      setSource('default');
      return;
    }

    const roomName = room || currentRoom;
    const requestId = `plant-stages-${Date.now()}`;
    
    setLoading(true);
    setError(null);
    pendingRequestRef.current = requestId;
    
    console.log('📤 Sending needPlantConfig event:', { room: roomName, mode, requestId });

    try {
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: PLANT_CONFIG_EVENT,
        event_data: {
          room: roomName,
          mode,
          requestId,
          atTime: new Date().toISOString(),
        },
      });

      timeoutRef.current = setTimeout(() => {
        if (pendingRequestRef.current === requestId) {
          pendingRequestRef.current = null;
          setError('No response from HA - using defaults');
          setPlantStages(createDefaultPlantStages());
          setSource('default');
          setLoading(false);
        }
      }, 10000);

    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      pendingRequestRef.current = null;
      setError(err.message || 'Failed to request plant stages');
      setPlantStages(createDefaultPlantStages());
      setSource('default');
      setLoading(false);
    }
  }, [connection, connectionState, currentRoom]);

  // Get stage config with fallback - NEVER returns null
  const getStageConfig = useCallback((stage = null) => {
    const targetStage = stage || currentStage;
    const config = plantStages?.[targetStage];
    if (config) return config;
    
    const defaults = createDefaultPlantStages();
    return defaults?.[targetStage] || defaults?.lateVeg || {
      minVPD: 0.9,
      maxVPD: 1.65,
      minTemp: 24,
      maxTemp: 27,
      minHumidity: 55,
      maxHumidity: 68,
    };
  }, [plantStages, currentStage]);

  const getAllStages = useCallback(() => {
    return plantStages || createDefaultPlantStages();
  }, [plantStages]);

  const getStageConfigWithFallback = useCallback((stage = null) => {
    const targetStage = stage || currentStage;
    const config = plantStages?.[targetStage];
    if (config) return config;
    
    const defaults = createDefaultPlantStages();
    return defaults?.[targetStage] || defaults?.lateVeg || {
      minVPD: 0.9,
      maxVPD: 1.65,
      minTemp: 24,
      maxTemp: 27,
      minHumidity: 55,
      maxHumidity: 68,
    };
  }, [plantStages, currentStage]);

  const value = {
    plantStages,
    lightPlantStages,
    currentStage,
    source,
    loading,
    error,
    getStageConfig,
    getStageConfigWithFallback,
    getAllStages,
    requestPlantStages,
    setCurrentStage,
    setPlantStages,
  };

  return (
    <PlantStageContext.Provider value={value}>
      {children}
    </PlantStageContext.Provider>
  );
};

export const usePlantStages = () => {
  const context = useContext(PlantStageContext);
  if (!context) {
    throw new Error('usePlantStages must be used within PlantStageProvider');
  }
  return context;
};