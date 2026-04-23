import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useMedium } from '../Context/MediumContext';
import { usePlantStages } from '../Context/PlantStageContext';
import DashboardChart from './DashboardChart';
import CombinedSoilChart from './CombinedSoilChart';
import { FaTint, FaBolt, FaFlask, FaThermometerHalf, FaSeedling, FaCalendar, FaClock, FaLeaf, FaArrowDown, FaArrowUp } from 'react-icons/fa';

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

const IndividualCharts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  const { entities, currentRoom } = useHomeAssistant();
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
        max: stageData?.maxEc || 2.5,
        optimal: ((stageData?.minEC || 1.0) + (stageData?.maxEc || 2.5)) / 2
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

  // Enhanced sensor detection - like GrowLogs
  const soilSensors = useMemo(() => {
    if (!entities) return null;

    const sensors = {};
    const roomLower = (currentRoom || '').toLowerCase();

    Object.entries(entities).forEach(([key, entity]) => {
      if (!key.startsWith('sensor.')) return;
      
      const keyLower = key.toLowerCase();
      const value = parseFloat(entity.state);
      if (isNaN(value)) return;
      
      // Moisture/VWC - Extended patterns like GrowLogs
      if (!sensors.moisture && (
        keyLower.includes('moisture') || 
        keyLower.includes('vwc') ||
        keyLower.includes('soil_moisture') ||
        keyLower.includes('medium_moisture')
      )) {
        sensors.moisture = { id: key, value };
      }
      
      // EC - Extended patterns like GrowLogs
      if (!sensors.ec && !keyLower.includes('water') && !keyLower.includes('co2') && (
        keyLower.includes('soil_ec') ||
        keyLower.includes('ec_soil') ||
        keyLower.includes('medium_ec') ||
        (keyLower.includes('ec') && keyLower.includes('soil'))
      )) {
        sensors.ec = { id: key, value };
      }
      
      // pH - Extended patterns
      if (!sensors.ph && !keyLower.includes('water') && !keyLower.includes('phase') && (
        keyLower.includes('soil_ph') ||
        keyLower.includes('medium_ph') ||
        (keyLower.includes('ph') && keyLower.includes('soil'))
      )) {
        sensors.ph = { id: key, value };
      }
      
      // Temperature - Extended patterns
      if (!sensors.temperature && (
        keyLower.includes('soil_temp') ||
        keyLower.includes('soil_temperature') ||
        keyLower.includes('temperature_soil') ||
        keyLower.includes('medium_temp')
      )) {
        sensors.temperature = { id: key, value };
      }
    });

    return sensors;
  }, [entities, currentRoom]);

  const hasSensors = soilSensors && Object.keys(soilSensors).length > 0;
  const hasCombinedChart = soilSensors?.moisture;

  // Calculate progress percentage and status
  const getTargetProgress = (value, min, max, optimal) => {
    if (value === null || value === undefined) return { percent: 0, status: 'unknown' };
    
    const status = getMetricStatus('moisture', value);
    const range = max - min;
    const percent = Math.min(100, Math.max(0, ((value - min) / range) * 100));
    
    return { percent, status };
  };

  // Get phase info
  const getPhaseInfo = () => {
    if (!currentMedium) return null;
    
    const phase = currentMedium.current_phase || currentMedium.plant_stage || 'Mid Veg';
    const bloomDays = currentMedium.dates?.bloomdays || 0;
    const totalBloomDays = currentMedium.dates?.breederbloomdays || 0;
    const totalDays = currentMedium.dates?.planttotaldays || 0;
    
    return { phase, bloomDays, totalBloomDays, totalDays };
  };

  const phaseInfo = getPhaseInfo();

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

        {hasSensors && (
          <>
            {/* Dry-Back Info */}
            {soilSensors.moisture && phaseTargets.moisture && (
              <DryBackInfo $trend="stable">
                <FaArrowDown /> Dry-Back: Calculate from history
              </DryBackInfo>
            )}

            <TargetsGrid>
              {/* Moisture Target */}
              {soilSensors.moisture && (
                <TargetItem>
                  <TargetHeaderRow>
                    <TargetIcon><FaTint /></TargetIcon>
                    <TargetLabel>Moisture</TargetLabel>
                  </TargetHeaderRow>
                  <TargetRow>
                    <TargetValue $status={getMetricStatus('moisture', soilSensors.moisture.value)}>
                      {soilSensors.moisture.value?.toFixed(1) || '--'}%
                    </TargetValue>
                  </TargetRow>
                  <TargetProgressBar>
                    <TargetProgressFill 
                      $percent={getTargetProgress(soilSensors.moisture.value, phaseTargets.moisture.min, phaseTargets.moisture.max, phaseTargets.moisture.optimal).percent}
                      $color={getTargetProgress(soilSensors.moisture.value, phaseTargets.moisture.min, phaseTargets.moisture.max, phaseTargets.moisture.optimal).status === 'optimal' ? 'var(--chart-success-color)' : getTargetProgress(soilSensors.moisture.value, phaseTargets.moisture.min, phaseTargets.moisture.max, phaseTargets.moisture.optimal).status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'}
                    />
                  </TargetProgressBar>
                  <TargetRow>
                    <TargetRange>
                      Target: {phaseTargets.moisture.min}-{phaseTargets.moisture.max}%
                    </TargetRange>
                  </TargetRow>
                </TargetItem>
              )}
              
              {/* EC Target */}
              {soilSensors.ec && (
                <TargetItem>
                  <TargetHeaderRow>
                    <TargetIcon><FaBolt /></TargetIcon>
                    <TargetLabel>EC</TargetLabel>
                  </TargetHeaderRow>
                  <TargetRow>
                    <TargetValue $status={getMetricStatus('ec', soilSensors.ec.value)}>
                      {soilSensors.ec.value?.toFixed(2) || '--'}
                    </TargetValue>
                  </TargetRow>
                  <TargetProgressBar>
                    <TargetProgressFill 
                      $percent={getTargetProgress(soilSensors.ec.value, phaseTargets.ec.min, phaseTargets.ec.max, phaseTargets.ec.optimal).percent}
                      $color={getTargetProgress(soilSensors.ec.value, phaseTargets.ec.min, phaseTargets.ec.max, phaseTargets.ec.optimal).status === 'optimal' ? 'var(--chart-success-color)' : getTargetProgress(soilSensors.ec.value, phaseTargets.ec.min, phaseTargets.ec.max, phaseTargets.ec.optimal).status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'}
                    />
                  </TargetProgressBar>
                  <TargetRow>
                    <TargetRange>
                      Target: {phaseTargets.ec.min}-{phaseTargets.ec.max} mS
                    </TargetRange>
                  </TargetRow>
                </TargetItem>
              )}
              
              {/* pH Target */}
              {soilSensors.ph && (
                <TargetItem>
                  <TargetHeaderRow>
                    <TargetIcon><FaFlask /></TargetIcon>
                    <TargetLabel>pH</TargetLabel>
                  </TargetHeaderRow>
                  <TargetRow>
                    <TargetValue $status={getMetricStatus('ph', soilSensors.ph.value)}>
                      {soilSensors.ph.value?.toFixed(1) || '--'}
                    </TargetValue>
                  </TargetRow>
                  <TargetProgressBar>
                    <TargetProgressFill 
                      $percent={getTargetProgress(soilSensors.ph.value, phaseTargets.ph.min, phaseTargets.ph.max, phaseTargets.ph.optimal).percent}
                      $color={getTargetProgress(soilSensors.ph.value, phaseTargets.ph.min, phaseTargets.ph.max, phaseTargets.ph.optimal).status === 'optimal' ? 'var(--chart-success-color)' : getTargetProgress(soilSensors.ph.value, phaseTargets.ph.min, phaseTargets.ph.max, phaseTargets.ph.optimal).status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'}
                    />
                  </TargetProgressBar>
                  <TargetRow>
                    <TargetRange>
                      Target: {phaseTargets.ph.min}-{phaseTargets.ph.max}
                    </TargetRange>
                  </TargetRow>
                </TargetItem>
              )}
              
              {/* Temperature Target */}
              {soilSensors.temperature && (
                <TargetItem>
                  <TargetHeaderRow>
                    <TargetIcon><FaThermometerHalf /></TargetIcon>
                    <TargetLabel>Temperature</TargetLabel>
                  </TargetHeaderRow>
                  <TargetRow>
                    <TargetValue $status={getMetricStatus('temperature', soilSensors.temperature.value)}>
                      {soilSensors.temperature.value?.toFixed(1) || '--'}°C
                    </TargetValue>
                  </TargetRow>
                  <TargetProgressBar>
                    <TargetProgressFill 
                      $percent={getTargetProgress(soilSensors.temperature.value, phaseTargets.temperature.min, phaseTargets.temperature.max, phaseTargets.temperature.optimal).percent}
                      $color={getTargetProgress(soilSensors.temperature.value, phaseTargets.temperature.min, phaseTargets.temperature.max, phaseTargets.temperature.optimal).status === 'optimal' ? 'var(--chart-success-color)' : getTargetProgress(soilSensors.temperature.value, phaseTargets.temperature.min, phaseTargets.temperature.max, phaseTargets.temperature.optimal).status === 'warning' ? 'var(--chart-warning-color)' : 'var(--chart-error-color)'}
                    />
                  </TargetProgressBar>
                  <TargetRow>
                    <TargetRange>
                      Target: {phaseTargets.temperature.min}-{phaseTargets.temperature.max}°C
                    </TargetRange>
                  </TargetRow>
                </TargetItem>
              )}
            </TargetsGrid>
          </>
        )}
      </TargetCard>

      {hasSensors ? (
        <ChartGrid>
          {/* Combined Soil Chart */}
          {hasCombinedChart && (
            <CombinedSoilChart
              soilSensors={soilSensors}
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={onLiveModeChange}
            />
          )}
          
          {/* Individual Charts */}
          <IndividualCharts>
            {soilSensors.ec && (
              <DashboardChart
                sensorId={soilSensors.ec.id}
                title="Soil EC"
                unit="mS/cm"
                priority="high"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={onLiveModeChange}
              />
            )}
            
            {soilSensors.ph && (
              <DashboardChart
                sensorId={soilSensors.ph.id}
                title="Soil pH"
                unit="pH"
                priority="high"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={onLiveModeChange}
              />
            )}
            
            {soilSensors.temperature && (
              <DashboardChart
                sensorId={soilSensors.temperature.id}
                title="Soil Temperature"
                unit="°C"
                priority="medium"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={onLiveModeChange}
              />
            )}
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

export default CropSteeringOverview;