import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useGlobalState } from '../Context/GlobalContext';
import { FaLeaf, FaChartBar, FaCircle, FaSync, FaBullseye, FaCheck, FaExclamationTriangle, FaTimes, FaChartArea, FaSeedling, FaCalendarAlt, FaClock, FaFlask } from 'react-icons/fa';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useMedium } from '../Context/MediumContext';
import { getThemeColor } from '../../utils/themeColors';

const LoadingIndicator = () => (
  <LoadingWrapper>
    <LoadingBackdrop />
    <LoadingContainer>
      <div className="loading-spinner">
        <FaLeaf className="loading-icon" />
      </div>
      <LoadingText>Grow Data is Loading...</LoadingText>
    </LoadingContainer>
  </LoadingWrapper>
);

const GrowMetrics = ({ room = 'default' }) => {
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [timeRange, setTimeRange] = useState('since_start');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [targetValues, setTargetValues] = useState({});

  const { entities, currentRoom, handleTabReactivation } = useHomeAssistant();
  const { 
    mediums, 
    currentMedium, 
    currentMediumIndex, 
    setCurrentMediumIndex, 
    loading: mediumLoading 
  } = useMedium();

  const { state } = useGlobalState();

  const [isLive, setIsLive] = useState(false);

  const srvAddr = state?.Conf?.hassServer;
  const token = state?.Conf?.haToken;

  // In dev mode, use Vite proxy. In production, use full URL
  const isDev = import.meta.env.DEV;
  
  const getApiUrl = (srvAddr) => {
    // In development, use relative URL to leverage Vite proxy
    if (isDev) {
      return ''; // Empty string means relative URL (/api/...)
    }
    
    if (!srvAddr) return '';
    
    try {
      let urlString = srvAddr;
      
      // Add protocol if missing
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = `http://${urlString}`;
      }
      
      const url = new URL(urlString);
      
      // If no port specified, add default HA port
      if (!url.port) {
        url.port = '8123';
      }
      
      return url.toString().replace(/\/$/, ''); // Remove trailing slash
    } catch (e) {
      console.error('Invalid server address:', srvAddr, e);
      return '';
    }
  };

  const apiBaseUrl = getApiUrl(srvAddr);

  useEffect(() => {
    let interval;

    if (isLive) {
      // Initiales Laden
      fetchAllGrowData();

      // Alle 30 Sekunden neu laden
      interval = setInterval(() => {
        fetchAllGrowData();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  // Default Werte als Fallback
  const defaultTargetValues = {
    vpd: { min: 1.1, max: 1.35, optimal: 1.2 },
    temperature: { min: 22, max: 28, optimal: (22 + 28) / 2 },
    humidity: { min: 50, max: 60, optimal: (50 + 60) / 2 },
    co2: { min: 600, max: 1000, optimal: 800 },
    pH: { min: 5.8, max: 6.2, optimal: 6.0 },
    EC: { min: 400.0, max: 5000, optimal: 2500 },
  };

  // Sensor Entity IDs - dynamisch aus verfügbaren Entities ermitteln
  const sensorEntities = useMemo(() => {
    const room = currentRoom?.toLowerCase() || 'default';

    // Definierte Sensor-Patterns für verschiedene Metriken
    const patterns = {
      vpd: [
        `sensor.ogb_currentvpd_${room}`,
      ],
      temperature: [
        `sensor.ogb_avgtemperature_${room}`,
      ],
      humidity: [
        `sensor.ogb_avghumidity_${room}`,
      ],
      // Für pH, EC, CO₂ jetzt room-spezifische Patterns
      pH: [`sensor.ogb_ph_${room}`, `sensor.${room}_ph`],
      EC: [`sensor.ogb_ec_${room}`, `sensor.${room}_ec`],
      co2: [`sensor.ogb_co2_${room}`, `sensor.${room}_co2`],
    };

    const foundEntities = {};

    Object.entries(patterns).forEach(([metric, pattern]) => {
      if (Array.isArray(pattern)) {
        // alte Logik: Liste von fixen Namen
        for (const candidate of pattern) {
          if (entities && entities[candidate]) {
            foundEntities[metric] = candidate;
            break;
          }
        }
      } else if (pattern instanceof RegExp) {
        // neue Logik: Regex-Suche
        const match = Object.keys(entities || {}).find(eid => pattern.test(eid));
        if (match) {
          foundEntities[metric] = match;
        }
      }
    });


    return foundEntities;
  }, [entities, currentRoom]);


  const controlEntities = useMemo(() => {
    const room = currentRoom?.toLowerCase() || 'default';

    const patterns = {
      temperature: {
        min: [`number.ogb_mintemp_${room}`],
        max: [`number.ogb_maxtemp_${room}`],
        optimal: [`number.ogb_opttemp_${room}`],
      },
      humidity: {
        min: [`number.ogb_minhum_${room}`],
        max: [`number.ogb_maxhum_${room}`],
        optimal: [`number.ogb_opthum_${room}`],
      },
      vpd: {
        min: [`sensor.ogb_current_vpd_target_min_${room}`],
        max: [`sensor.ogb_current_vpd_target_max_${room}`],
        optimal: [`sensor.ogb_current_vpd_target_${room}`],
      },
      co2: {
        min: [`number.ogb_co2minvalue_${room}`],
        max: [`number.ogb_co2maxvalue_${room}`],
        optimal: [`number.ogb_co2targetvalue_${room}`],
      },
      pH: {
        min: [`number.ogb_minph_${room}`, `number.${room}_ph_min`],
        max: [`number.ogb_maxph_${room}`, `number.${room}_ph_max`],
        optimal: [`number.ogb_feed_ph_target_${room}`],
      },
      EC: {
        min: [`number.ogb_minec_${room}`, `number.${room}_ec_min`],
        max: [`number.ogb_maxec_${room}`, `number.${room}_ec_max`],
        optimal: [`number.ogb_feed_ec_target_${room}`],
      },
    };

    const found = {};
    Object.entries(patterns).forEach(([metric, limits]) => {
      found[metric] = {};
      Object.entries(limits).forEach(([bound, entityPatterns]) => {
        for (const pattern of entityPatterns) {
          if (entities && entities[pattern]) {
            found[metric][bound] = pattern;
            break;
          }
        }
      });
    });

    return found;
  }, [entities, currentRoom]);

  // Kombiniere Control Entities Werte mit Default Werten als Fallback
  const loadedTargetValues = useMemo(() => {
    const result = {};

    Object.keys(defaultTargetValues).forEach(metric => {
      const controlEntity = controlEntities[metric];
      const defaultValues = defaultTargetValues[metric];

      result[metric] = {
        min: defaultValues.min,
        max: defaultValues.max,
        optimal: defaultValues.optimal
      };

      // Wenn Control Entities verfügbar sind, deren Werte verwenden
      if (controlEntity && entities) {
        if (controlEntity.min && entities[controlEntity.min]) {
          const minValue = parseFloat(entities[controlEntity.min].state);
          if (!isNaN(minValue)) {
            result[metric].min = minValue;
          }
        }

        if (controlEntity.max && entities[controlEntity.max]) {
          const maxValue = parseFloat(entities[controlEntity.max].state);
          if (!isNaN(maxValue)) {
            result[metric].max = maxValue;
          }
        }

        if (controlEntity.optimal && entities[controlEntity.optimal]) {
          const optimalValue = parseFloat(entities[controlEntity.optimal].state);
          if (!isNaN(optimalValue)) {
            result[metric].optimal = optimalValue;
          }
        }
      }
    });

    return result;
  }, [controlEntities, entities]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Get grow start date from current medium
  const growStartDate = useMemo(() => {
    if (!currentMedium?.dates?.growstartdate) return null;
    try {
      const date = new Date(currentMedium.dates.growstartdate);
      // Validate date
      if (isNaN(date.getTime())) return null;
      return date;
    } catch {
      return null;
    }
  }, [currentMedium]);

  const getTimeRangeDate = () => {
    const now = new Date();
    
    // If we have a grow start date, calculate from there
    if (growStartDate) {
      let startDate;
      let endDate = now;
      
      switch (timeRange) {
        case 'since_start':
          // From grow start until now
          startDate = growStartDate;
          break;
        case 'last_7d':
          // Last 7 days (but not before grow start)
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (startDate < growStartDate) startDate = growStartDate;
          break;
        case 'last_14d':
          // Last 14 days (but not before grow start)
          startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          if (startDate < growStartDate) startDate = growStartDate;
          break;
        case 'last_30d':
          // Last 30 days (but not before grow start)
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (startDate < growStartDate) startDate = growStartDate;
          break;
        case 'first_week':
          // First week of grow
          startDate = growStartDate;
          endDate = new Date(growStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (endDate > now) endDate = now;
          break;
        case 'bloom_phase':
          // From bloom switch until now (if available)
          if (currentMedium?.dates?.bloomswitchdate) {
            startDate = new Date(currentMedium.dates.bloomswitchdate);
          } else {
            startDate = growStartDate;
          }
          break;
        default:
          startDate = growStartDate;
      }
      
      return {
        start: startDate.toISOString().slice(0, 19),
        end: endDate.toISOString().slice(0, 19)
      };
    }
    
    // Fallback: No medium selected, use last 7 days
    let hoursBack = 168; // 7 Tage default

    switch (timeRange) {
      case 'last_7d': hoursBack = 168; break;
      case 'last_14d': hoursBack = 336; break;
      case 'last_30d': hoursBack = 720; break;
      default: hoursBack = 168;
    }

    const startDate = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    return {
      start: startDate.toISOString().slice(0, 19),
      end: now.toISOString().slice(0, 19)
    };
  };

  const fetchSensorData = async (entityId, startTime, endTime) => {
    // Build URL - in dev mode, use relative path for proxy
    const baseUrlPart = apiBaseUrl ? apiBaseUrl : '';
    const url = `${baseUrlPart}/api/history/period/${encodeURIComponent(startTime)}?filter_entity_id=${entityId}&end_time=${encodeURIComponent(endTime)}`;
    console.log('GrowMetrics fetching from:', url, 'isDev:', isDev);

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching ${entityId}: ${response.statusText}`);
      }

      const data = await response.json();
      return data && data.length > 0 ? data[0] : [];
    } catch (err) {
      console.warn(`Failed to fetch data for ${entityId}:`, err);
      return [];
    }
  };

  const fetchAllGrowData = async () => {
    if (!srvAddr || !token) {
      setError('Home Assistant Server oder Token nicht konfiguriert');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getTimeRangeDate();
      
      // Alle Sensor-Daten parallel laden
      const sensorPromises = Object.entries(sensorEntities).map(async ([metric, entityId]) => {
        const data = await fetchSensorData(entityId, start, end);
        return { metric, data };
      });

      const sensorResults = await Promise.all(sensorPromises);

      // Daten zu einem Timeline-Format kombinieren
      const timelineData = {};
      
      sensorResults.forEach(({ metric, data }) => {
        data.forEach(reading => {
          const timestamp = reading.last_changed;
          const value = parseFloat(reading.state);
          
          if (!isNaN(value) && timestamp) {
            // VPD DataCleaner → 0.0 ignorieren
            if (metric === "vpd" && value === 0.0) {
              return;
            }

            if (!timelineData[timestamp]) {
              timelineData[timestamp] = { timestamp };
            }
            timelineData[timestamp][metric] = value;
          }
        });
      });

      // Sortiere nach Timestamp und konvertiere zu Array
      const sortedData = Object.values(timelineData)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(reading => ({
          ...reading,
          timestamp: new Date(reading.timestamp).toISOString()
        }));

      setHistoricalData(sortedData);

      // Target Values setzen
      setTargetValues(loadedTargetValues);

    } catch (err) {
      console.error('Error fetching grow data:', err);
      setError('Fehler beim Laden der Grow-Daten');
    } finally {
      setLoading(false);
    }
  };


  // Fetch data only when fetch parameters change
  useEffect(() => {
    fetchAllGrowData();
  }, [timeRange, room, srvAddr, token, currentMediumIndex, growStartDate]);

  // Update target values separately (doesn't trigger data fetch)
  useEffect(() => {
    setTargetValues(loadedTargetValues);
  }, [loadedTargetValues]);

  // Handle tab visibility changes to prevent black screens
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became active - validate data and refresh if needed
        console.log('GrowMetrics: Tab became active, validating data...');

        // If we have no data or connection issues, refresh
        if (!historicalData.length && !loading && !error) {
          console.log('GrowMetrics: No data found, refreshing...');
          fetchAllGrowData();
        }

        // Trigger tab reactivation handling
        handleTabReactivation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [historicalData.length, loading, error, handleTabReactivation]);

  // Analyse der Daten (gleiche Logik wie vorher)
  const analysis = useMemo(() => {
    if (!historicalData.length || !Object.keys(targetValues).length) {
      return {};
    }

    const results = {};
    
    Object.keys(targetValues).forEach(metric => {
      const values = historicalData
        .map(d => d[metric])
        .filter(v => v !== undefined && !isNaN(v));
      
      if (values.length === 0) {
        results[metric] = {
          total: 0,
          optimal: 0,
          inRange: 0,
          nearRange: 0,
          outOfRange: 0,
          optimalPercent: '0.0',
          inRangePercent: '0.0',
          nearRangePercent: '0.0',
          outOfRangePercent: '0.0',
          average: '0.00',
          min: '0.00',
          max: '0.00',
          currentValue: '0.00'
        };
        return;
      }

      const target = targetValues[metric];
      let inRange = 0;
      let nearRange = 0;
      let outOfRange = 0;
      
      const tolerance = (target.max - target.min) * 0.05; // 5% Toleranz
      const optimalTolerance = (target.max - target.min) * 0.1; // 10% um Optimal-Wert
      
      let optimal = 0;
      
       values.forEach(value => {
         // Prüfe zuerst optimal (engster Bereich um optimal value)
         if (value >= (target.optimal - optimalTolerance) && value <= (target.optimal + optimalTolerance)) {
           optimal++;
         }
         // Dann normale Bereichsprüfung (ausschließlich optimal values)
         else if (value >= target.min && value <= target.max) {
           inRange++;
         } else if (value >= (target.min - tolerance) && value <= (target.max + tolerance)) {
           nearRange++;
         } else {
           outOfRange++;
         }
       });
      
      const total = values.length;
      results[metric] = {
        total,
        optimal,
        inRange,
        nearRange,
        outOfRange,
        optimalPercent: ((optimal / total) * 100).toFixed(1),
        inRangePercent: ((inRange / total) * 100).toFixed(1),
        nearRangePercent: ((nearRange / total) * 100).toFixed(1),
        outOfRangePercent: ((outOfRange / total) * 100).toFixed(1),
        average: (values.reduce((a, b) => a + b, 0) / total).toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        currentValue: values[values.length - 1]?.toFixed(2) || '0.00'
      };
    });
    
    return results;
  }, [historicalData, targetValues]);

  const overallScore = useMemo(() => {
      // Include all metrics with data (don't filter out 0% scores)
      const metricsWithData = Object.values(analysis).filter(a => a.total > 0);

      if (metricsWithData.length === 0) return { avgRange: '0.0', avgOptimal: '0.0' };

      const optimalScores = metricsWithData.map(a => parseFloat(a.optimalPercent));
      const inRangeScores = metricsWithData.map(a => parseFloat(a.inRangePercent));

      const avgOptimal = optimalScores.reduce((a, b) => a + b, 0) / optimalScores.length;
      const avgInRange = inRangeScores.length > 0 ? inRangeScores.reduce((a, b) => a + b, 0) / inRangeScores.length : 0;

      return {
          avgRange: isNaN(avgInRange) ? '0.0' : avgInRange.toFixed(2),
          avgOptimal: isNaN(avgOptimal) ? '0.0' : avgOptimal.toFixed(2)
      };
  }, [analysis]);

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return 'var(--cannabis-active-color)';
    if (percentage >= 60) return 'var(--warning-text-color)';
    return 'var(--error-text-color)';
  };

  const getMetricUnit = (metric) => {
    const units = {
      pH: '',
      EC: 'mS/cm',
      temperature: '°C',
      humidity: '%',
      co2: 'ppm',
      vpd: 'kPa',
      lightIntensity: '%'
    };
    return units[metric] || '';
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <FaExclamationTriangle size={16} /> {error}
          <RetryButton onClick={fetchAllGrowData}>
            Retry Again
          </RetryButton>
        </ErrorMessage>
      </Container>
    );
  }

  if (!historicalData.length && !loading) {
    return (
      <Container>
        <NoDataMessage>
          <FaChartArea size={48} /> No data available for the selected time period
          <DataInfo>
            Room: {currentRoom || 'Unknown'} | Time: {timeRange}
          </DataInfo>
          <RetryButton onClick={fetchAllGrowData}>
            Try Reload
          </RetryButton>
        </NoDataMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title><FaChartBar size={18} /> Analytics</Title>
        <OverallScore score={overallScore.avgRange}>
          Overall Range: {overallScore.avgRange}%
        </OverallScore>
        <OverallScore score={overallScore.avgOptimal}>
          Overall Optimal: {overallScore.avgOptimal}%
        </OverallScore>
        <LiveButton
          isActive={isLive}
          onClick={() => setIsLive(!isLive)}
        >
          <FaCircle size={12} color={isLive ? 'var(--error-text-color)' : 'var(--disabled-text-color)'} /> {isLive ? 'Live' : 'Live Off'}
        </LiveButton>
      </Header>

      {/* Medium Info Card */}
      {currentMedium && (
        <MediumInfoCard>
          <MediumInfoHeader>
            <MediumIcon>
              <FaFlask size={24} />
            </MediumIcon>
            <MediumTitleSection>
              <MediumName>{currentMedium.plant_name || currentMedium.medium_name || 'Unknown Plant'}</MediumName>
              <MediumStrain>{currentMedium.breeder_name || 'Unknown Strain'}</MediumStrain>
            </MediumTitleSection>
            <PhaseBadge $phase={currentMedium.plant_stage || currentMedium.current_phase}>
              {currentMedium.plant_stage || currentMedium.current_phase || 'Unknown'}
            </PhaseBadge>
          </MediumInfoHeader>
          
          <MediumStats>
            <MediumStatItem>
              <MediumStatIcon><FaCalendarAlt size={16} /></MediumStatIcon>
              <MediumStatContent>
                <MediumStatLabel>Grow Start</MediumStatLabel>
                <MediumStatValue>{formatDate(currentMedium.dates?.growstartdate)}</MediumStatValue>
              </MediumStatContent>
            </MediumStatItem>
            
            {currentMedium.dates?.bloomswitchdate && (
              <MediumStatItem>
                <MediumStatIcon><FaSeedling size={16} /></MediumStatIcon>
                <MediumStatContent>
                  <MediumStatLabel>Bloom Switch</MediumStatLabel>
                  <MediumStatValue>{formatDate(currentMedium.dates?.bloomswitchdate)}</MediumStatValue>
                </MediumStatContent>
              </MediumStatItem>
            )}
            
            <MediumStatItem>
              <MediumStatIcon><FaClock size={16} /></MediumStatIcon>
              <MediumStatContent>
                <MediumStatLabel>Total Days</MediumStatLabel>
                <MediumStatValue>{currentMedium.dates?.planttotaldays || 0} days</MediumStatValue>
              </MediumStatContent>
            </MediumStatItem>
            
            {currentMedium.dates?.bloomdays > 0 && (
              <MediumStatItem>
                <MediumStatIcon><FaLeaf size={16} /></MediumStatIcon>
                <MediumStatContent>
                  <MediumStatLabel>Bloom Days</MediumStatLabel>
                  <MediumStatValue>{currentMedium.dates?.bloomdays || 0} / {currentMedium.dates?.breederbloomdays || '?'}</MediumStatValue>
                </MediumStatContent>
              </MediumStatItem>
            )}
          </MediumStats>
        </MediumInfoCard>
      )}

      {!currentMedium && !mediumLoading && (
        <NoMediumWarning>
          <FaSeedling size={24} />
          <span>No medium selected. Configure a medium in the GrowBook to track grow-specific data.</span>
        </NoMediumWarning>
      )}

      <Controls>
        {/* Medium Selector */}
        {mediums && mediums.length > 0 && (
          <Select 
            value={currentMediumIndex.toString()} 
            onChange={(e) => setCurrentMediumIndex(parseInt(e.target.value))}
          >
            {mediums.map((m, idx) => (
              <option key={idx} value={idx}>
                {m.plant_name || m.medium_name || `Medium ${idx + 1}`}
              </option>
            ))}
          </Select>
        )}

        <Select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
          <option value="all">All Metrics</option>
          <option value="pH">pH</option>
          <option value="EC">EC</option>
          <option value="temperature">Temperature</option>
          <option value="humidity">Humidity</option>
          <option value="co2">CO2</option>
          <option value="vpd">VPD</option>
          <option value="lightIntensity">Light Intensity</option>
        </Select>
        
        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          {growStartDate ? (
            <>
              <option value="since_start">Since Grow Start</option>
              <option value="last_7d">Last 7 Days</option>
              <option value="last_14d">Last 14 Days</option>
              <option value="last_30d">Last 30 Days</option>
              <option value="first_week">First Week</option>
              {currentMedium?.dates?.bloomswitchdate && (
                <option value="bloom_phase">Bloom Phase</option>
              )}
            </>
          ) : (
            <>
              <option value="last_7d">Last 7 Days</option>
              <option value="last_14d">Last 14 Days</option>
              <option value="last_30d">Last 30 Days</option>
            </>
          )}
        </Select>

        <RefreshButton onClick={fetchAllGrowData}>
          <FaSync size={16} /> Refresh
        </RefreshButton>
      </Controls>

      <DataStats>
        <StatItem>
          <StatLabel>Total Readings</StatLabel>
          <StatValue>{historicalData.length}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Data Period</StatLabel>
          <StatValue>
            {growStartDate 
              ? (timeRange === 'since_start' 
                  ? `${currentMedium?.dates?.planttotaldays || 0} days` 
                  : timeRange.replace('_', ' ').replace('last ', ''))
              : timeRange.replace('_', ' ')
            }
          </StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Active Sensors</StatLabel>
          <StatValue>{Object.keys(sensorEntities).length}/{Object.keys(controlEntities).length}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Room</StatLabel>
          <StatValue>{currentRoom || 'Unknown'}</StatValue>
        </StatItem>
      </DataStats>

      {Object.keys(sensorEntities).length === 0 && (
        <WarningMessage>
          <FaExclamationTriangle size={16} /> NO SENSOR FOUND FOR ROOM: {currentRoom}
          <SensorList>
            Searched Sensors:
            <ul>
              <li>sensor.ogb_avgtemp_{currentRoom?.toLowerCase()}</li>
              <li>sensor.ogb_avghum_{currentRoom?.toLowerCase()}</li>
              <li>sensor.ogb_currentvpd_{currentRoom?.toLowerCase()}</li>
              <li>sensor.{currentRoom}_ph</li>
              <li>sensor.{currentRoom}_ec</li>
              <li>sensor.{currentRoom}_co2</li>
              <li>sensor.{currentRoom}_light_intensity</li>
            </ul>
          </SensorList>
        </WarningMessage>
      )}

      {/* Target Values Status Anzeige */}
      <Summary>
        <SummaryTitle>Performance Summary</SummaryTitle>
        <SummaryGrid>
          {Object.entries(analysis).map(([metric, data]) => (
            <SummaryItem key={metric}>
              <SummaryMetric>{metric}</SummaryMetric>
              <OptimalIndicator>
                <SummaryPercentage color="var(--cannabis-active-color)">
                  {data.optimalPercent}%
                </SummaryPercentage>
                <OptimalLabel>Optimal</OptimalLabel>
              </OptimalIndicator>
              <InRangeIndicator>
                <SummaryPercentage color={getStatusColor(data.inRangePercent)} style={{fontSize: '1.2rem'}}>
                  {data.inRangePercent}%
                </SummaryPercentage>
                <OptimalLabel>In Range</OptimalLabel>
              </InRangeIndicator>
            </SummaryItem>
          ))}
        </SummaryGrid>
      </Summary>

      <MetricsGrid>
        {Object.entries(analysis)
          .filter(([metric]) => selectedMetric === 'all' || selectedMetric === metric)
          .map(([metric, data]) => (
            <MetricCard key={metric}>
              <MetricHeader>
                <MetricName>{metric.toUpperCase()}</MetricName>
                <CurrentValue>
                  {data.currentValue} {getMetricUnit(metric)}
                </CurrentValue>
              </MetricHeader>

              <TargetRange>
                Target: {targetValues[metric]?.min} - {targetValues[metric]?.max} {getMetricUnit(metric)}
                <OptimalValue>Optimal: {targetValues[metric]?.optimal}</OptimalValue>
              </TargetRange>

               <StatsGrid>
                 <StatItem>
                   <StatLabel><FaBullseye size={14} /> Optimal</StatLabel>
                   <StatValue color={getStatusColor(data.optimalPercent)}>
                     {data.optimalPercent}%
                   </StatValue>
                   <StatCount>({data.optimal}/{data.total})</StatCount>
                 </StatItem>

                 <StatItem>
                   <StatLabel><FaCheck size={14} /> In Range</StatLabel>
                   <StatValue color={getStatusColor(data.inRangePercent)}>
                     {data.inRangePercent}%
                   </StatValue>
                   <StatCount>({data.inRange}/{data.total})</StatCount>
                 </StatItem>

                 <StatItem>
                   <StatLabel><FaExclamationTriangle size={14} /> Near Range</StatLabel>
                   <StatValue color={getStatusColor(60)}>
                     {data.nearRangePercent}%
                   </StatValue>
                   <StatCount>({data.nearRange}/{data.total})</StatCount>
                 </StatItem>

                 <StatItem>
                   <StatLabel><FaTimes size={14} /> Out of Range</StatLabel>
                   <StatValue color={getStatusColor(0)}>
                     {data.outOfRangePercent}%
                   </StatValue>
                   <StatCount>({data.outOfRange}/{data.total})</StatCount>
                 </StatItem>
               </StatsGrid>

              <ProgressBar>
                <ProgressSegment 
                  width={data.optimalPercent} 
                  color="var(--cannabis-active-color)"
                  title={`Optimal: ${data.optimalPercent}%`}
                />
                <ProgressSegment 
                  width={data.inRangePercent} 
                  color={getStatusColor(data.inRangePercent)}
                  title={`In Range: ${data.inRangePercent}%`}
                />
                <ProgressSegment 
                  width={data.nearRangePercent} 
                  color={getStatusColor(60)}
                  title={`Near Range: ${data.nearRangePercent}%`}
                />
                <ProgressSegment 
                  width={data.outOfRangePercent} 
                  color={getStatusColor(0)}
                  title={`Out of Range: ${data.outOfRangePercent}%`}
                />
              </ProgressBar>

              <DetailStats>
                <DetailStat>
                  <span>Average:</span>
                  <span>{data.average} {getMetricUnit(metric)}</span>
                </DetailStat>
                <DetailStat>
                  <span>Min/Max:</span>
                  <span>{data.min} / {data.max} {getMetricUnit(metric)}</span>
                </DetailStat>
              </DetailStats>
            </MetricCard>
          ))}
      </MetricsGrid>
    </Container>
  );
};




// Styled Components (gleiche wie vorher, plus neue für Loading/Error)
const Container = styled.div`
  color: var(--main-text-color);
  overflow: hidden;
  font-size: 0.875rem;
  background: var(--main-bg-card-color);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  margin-right: 2rem;
  min-height: 50vh;
  min-width: 100%;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    var(--glass-shadow-inset);
  border: 1px solid var(--glass-border-light);
  padding: 2rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      rgba(59, 130, 246, 0.4) 0%,
      rgba(147, 51, 234, 0.4) 50%,
      rgba(236, 72, 153, 0.4) 100%
    );
  }

  @media (max-width: 768px) {
    margin-right: 1rem;
    padding: 1.5rem;
    border-radius: 20px;
    min-height: 50vh;
  }

  @media (max-width: 640px) {
    margin-right: 0.5rem;
    padding: 1.25rem;
    border-radius: 16px;
    min-height: 35vh;
  }
`;

// Loading wrapper to contain backdrop and spinner
const LoadingWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Backdrop blur for background
const LoadingBackdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1;
`;

const LoadingContainer = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: var(--main-bg-card-color);
  backdrop-filter: blur(20px);
  padding: 3rem 2rem;
  border-radius: 24px;
  border: 1px solid var(--glass-border-light);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

  .loading-spinner {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--chart-success-color) 0%, var(--main-arrow-up) 50%, var(--cannabis-active-color) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: spin 2s linear infinite;
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.3);

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      left: -6px;
      right: -6px;
      bottom: -6px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--chart-success-color) 0%, var(--main-arrow-up) 50%, var(--cannabis-active-color) 100%);
      opacity: 0.3;
      animation: pulse 2s ease-in-out infinite;
    }

    &::after {
      content: '';
      position: absolute;
      top: -12px;
      left: -12px;
      right: -12px;
      bottom: -12px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--chart-success-color) 0%, var(--main-arrow-up) 50%, var(--cannabis-active-color) 100%);
      opacity: 0.1;
      animation: pulse 2s ease-in-out infinite reverse;
    }
  }

  .loading-icon {
    font-size: 2rem;
    color: white;
    z-index: 1;
    animation: bounce 1.5s ease-in-out infinite alternate;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.15); opacity: 0.1; }
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-6px); }
  }

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    gap: 1.25rem;

    .loading-spinner {
      width: 70px;
      height: 70px;
    }

    .loading-icon {
      font-size: 1.75rem;
    }
  }
`;

const LoadingText = styled.div`
  font-size: 1rem;
  opacity: 0.8;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--error-text-color);
  gap: 1.5rem;
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.1) 0%,
    rgba(220, 38, 38, 0.05) 100%
  );
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 3rem 2rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.1);

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    font-size: 1rem;
    gap: 1.25rem;
    border-radius: 16px;
  }
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--cannabis-active-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
     background: var(--cannabis-active-color);
  }
`;

const NoDataMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 1.5rem;
  background: var(--glass-bg-primary);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 3rem 2rem;
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    gap: 1.25rem;
    border-radius: 16px;
  }
`;

const DataInfo = styled.div`
  font-size: 0.8rem;
  opacity: 0.6;
`;

const RefreshButton = styled.button`
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.8) 0%,
    rgba(37, 99, 235, 0.9) 100%
  );
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }

  &:hover {
    background: linear-gradient(135deg,
      rgba(37, 99, 235, 0.9) 0%,
      rgba(29, 78, 216, 1) 100%
    );
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);

    &::before {
      width: 100%;
      height: 100%;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

    &::before {
      width: 100%;
      height: 100%;
    }
  }

  @media (max-width: 640px) {
    padding: 0.625rem 1rem;
    font-size: 0.825rem;
    gap: 0.375rem;
  }
`;

const DataStats = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 1.5rem;
  background: var(--glass-bg-primary);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  @media (max-width: 640px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
`;

// Alle anderen styled components wie in der vorherigen Version...
const Header = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  gap: 0.75rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 640px) {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  margin-right: auto;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--main-text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.01em;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1rem;
    gap: 0.375rem;
  }
`;

const OverallScore = styled.div`
  padding: 0.5rem 0.875rem;
  border-radius: 20px;
  background: ${props => props.score >= 80 
    ? 'rgba(34, 197, 94, 0.15)' 
    : props.score >= 60 
      ? 'rgba(245, 158, 11, 0.15)' 
      : 'rgba(239, 68, 68, 0.15)'
  };
  color: ${props => props.score >= 80 
    ? '#22c55e' 
    : props.score >= 60 
      ? '#f59e0b' 
      : '#ef4444'
  };
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  border: 1px solid ${props => props.score >= 80
    ? 'rgba(34, 197, 94, 0.3)'
    : props.score >= 60
      ? 'rgba(245, 158, 11, 0.3)'
      : 'rgba(239, 68, 68, 0.3)'
  };
  white-space: nowrap;

  @media (max-width: 640px) {
    padding: 0.375rem 0.625rem;
    font-size: 0.7rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 640px) {
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid var(--glass-border-light);
  border-radius: 12px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(8px);
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    box-shadow:
      0 0 0 3px rgba(59, 130, 246, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
  }

  @media (max-width: 640px) {
    padding: 0.625rem 0.875rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 2rem;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 640px) {
    padding: 1.25rem;
    border-radius: 16px;
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const MetricName = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--focus-color);
`;

const CurrentValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cannabis-active-color);
`;

const TargetRange = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.8rem;
`;

const OptimalValue = styled.div`
  color: var(--cannabis-active-color);
  font-weight: 500;
  margin-top: 0.25rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.color};
`;

const StatCount = styled.div`
  font-size: 0.65rem;
  opacity: 0.6;
  margin-top: 0.25rem;
`;

const ProgressBar = styled.div`
  display: flex;
  height: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 1.5rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ProgressSegment = styled.div`
  width: ${props => props.width}%;
  background: linear-gradient(135deg,
    ${props => props.color} 0%,
    ${props => props.color}80 50%,
    ${props => props.color} 100%
  );
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 3px;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 0 8px 8px 0;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
  }
`;

const DetailStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  opacity: 0.8;
`;

const DetailStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  span:first-child {
    opacity: 0.6;
  }
  
  span:last-child {
    font-weight: 500;
  }
`;

const Summary = styled.div`
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 640px) {
    padding: 1.25rem;
    margin-bottom: 1.25rem;
    border-radius: 16px;
  }
`;

const SummaryTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const SummaryMetric = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const WarningMessage = styled.div`
  background: linear-gradient(135deg,
    rgba(245, 158, 11, 0.15) 0%,
    rgba(217, 119, 6, 0.1) 100%
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: var(--warning-text-color);
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.1);

  @media (max-width: 640px) {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }
`;

const OptimalIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const InRangeIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SensorList = styled.div`
  margin-top: 0.5rem;
  font-size: 0.7rem;
  opacity: 0.8;

  ul {
    margin: 0.5rem 0;
    padding-left: 1rem;
  }

  li {
    margin: 0.2rem 0;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }
`;

const SummaryPercentage = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.color};
`;

const LiveButton = styled.button`
  padding: 0.5rem 0.875rem;
  border-radius: 20px;
  background: ${props => props.isActive
    ? 'rgba(239, 68, 68, 0.15)'
    : 'rgba(107, 114, 128, 0.15)'
  };
  border: 1px solid ${props => props.isActive
    ? 'rgba(239, 68, 68, 0.3)'
    : 'rgba(255, 255, 255, 0.15)'
  };
  color: ${props => props.isActive ? '#ef4444' : 'var(--second-text-color)'};
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;

  ${props => props.isActive && `
    animation: livePulse 2s ease-in-out infinite;
  `}

  &:hover {
    background: ${props => props.isActive
      ? 'rgba(239, 68, 68, 0.25)'
      : 'rgba(107, 114, 128, 0.25)'
    };
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @keyframes livePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @media (max-width: 640px) {
    padding: 0.375rem 0.625rem;
    font-size: 0.7rem;
    gap: 0.25rem;
  }
`;


const OptimalLabel = styled.div``;

// Medium Info Card Styles
const MediumInfoCard = styled.div`
  background: linear-gradient(135deg,
    rgba(74, 222, 128, 0.1) 0%,
    rgba(34, 197, 94, 0.05) 100%
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(74, 222, 128, 0.6) 30%,
      rgba(34, 197, 94, 0.8) 50%,
      rgba(74, 222, 128, 0.6) 70%,
      transparent 100%
    );
    border-radius: 20px 20px 0 0;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 16px;
  }
`;

const MediumInfoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(74, 222, 128, 0.2);

  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
`;

const MediumIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 48px;
    height: 48px;
  }
`;

const MediumTitleSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const MediumName = styled.h3`
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 640px) {
    font-size: 1.125rem;
  }
`;

const MediumStrain = styled.div`
  font-size: 0.9rem;
  color: var(--second-text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PhaseBadge = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  
  background: ${props => {
    const phase = props.$phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return 'rgba(74, 222, 128, 0.2)';
    } else if (phase === 'flower' || phase === 'flowering') {
      return 'rgba(251, 191, 36, 0.2)';
    } else if (phase === 'harvest' || phase === 'drying') {
      return 'rgba(239, 68, 68, 0.2)';
    }
    return 'rgba(59, 130, 246, 0.2)';
  }};
  
  color: ${props => {
    const phase = props.$phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return '#22c55e';
    } else if (phase === 'flower' || phase === 'flowering') {
      return '#f59e0b';
    } else if (phase === 'harvest' || phase === 'drying') {
      return '#ef4444';
    }
    return '#3b82f6';
  }};
  
  border: 1px solid ${props => {
    const phase = props.$phase?.toLowerCase();
    if (phase === 'veg' || phase === 'vegetative') {
      return 'rgba(74, 222, 128, 0.4)';
    } else if (phase === 'flower' || phase === 'flowering') {
      return 'rgba(251, 191, 36, 0.4)';
    } else if (phase === 'harvest' || phase === 'drying') {
      return 'rgba(239, 68, 68, 0.4)';
    }
    return 'rgba(59, 130, 246, 0.4)';
  }};
`;

const MediumStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const MediumStatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(74, 222, 128, 0.3);
  }
`;

const MediumStatIcon = styled.div`
  color: #4ade80;
  opacity: 0.8;
  flex-shrink: 0;
`;

const MediumStatContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const MediumStatLabel = styled.div`
  font-size: 0.7rem;
  color: var(--second-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const MediumStatValue = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--main-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoMediumWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg,
    rgba(245, 158, 11, 0.1) 0%,
    rgba(217, 119, 6, 0.05) 100%
  );
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  margin-bottom: 2rem;
  color: var(--warning-text-color);
  font-size: 0.9rem;
  font-weight: 500;

  svg {
    flex-shrink: 0;
    opacity: 0.8;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
    padding: 1rem;
  }
`;

export default GrowMetrics;