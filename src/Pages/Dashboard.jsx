import { useEffect, useState, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MdDashboard, MdWaterDrop, MdInsights, MdBolt, MdSmartToy } from 'react-icons/md';
import { Zap, Sun, Plug, Battery, Droplets, Leaf, Lightbulb, Sprout } from 'lucide-react';
import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import DashboardChart from '../Components/Dashboard/DashboardChart';
import CombinedClimateChart from '../Components/Dashboard/CombinedClimateChart';
import CombinedWaterChart from '../Components/Dashboard/CombinedWaterChart';
import RoomPowerSensors from '../Components/Dashboard/RoomPowerSensors';
import BottomBar from '../Components/Navigation/BottomBar';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import GrowMetrics from '../Components/Dashboard/GrowMetrics';
import { MediumProvider } from '../Components/Context/MediumContext';
import CropSteeringOverview from '../Components/Dashboard/CropSteeringOverview';
import { FaSpinner, FaLeaf } from 'react-icons/fa';


const Dashboard = () => {
  const { currentRoom, entities, connectionState } = useHomeAssistant();
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState(null);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState(() => localStorage.getItem('dashboardActiveTab') || 'analytics');
  const [selectedCO2SensorIndex, setSelectedCO2SensorIndex] = useState(0);
  const roomDropdownRef = useRef(null);

  // Global live mode state - shared across all charts
  const [isGlobalLiveMode, setIsGlobalLiveMode] = useState(false);
  const [globalLiveRefreshTrigger, setGlobalLiveRefreshTrigger] = useState(0);
  const globalLiveIntervalRef = useRef(null);

  // Global live mode interval - 30 seconds
  useEffect(() => {
    if (isGlobalLiveMode) {
      // Trigger immediate refresh when live mode is activated
      setGlobalLiveRefreshTrigger(prev => prev + 1);
      
      // Set up 30-second interval for all charts
      globalLiveIntervalRef.current = setInterval(() => {
        setGlobalLiveRefreshTrigger(prev => prev + 1);
      }, 30000); // 30 seconds
    } else {
      // Clear interval when live mode is deactivated
      if (globalLiveIntervalRef.current) {
        clearInterval(globalLiveIntervalRef.current);
        globalLiveIntervalRef.current = null;
      }
    }

    return () => {
      if (globalLiveIntervalRef.current) {
        clearInterval(globalLiveIntervalRef.current);
      }
    };
  }, [isGlobalLiveMode]);

  // Handle global live mode toggle from any chart
  const handleLiveModeChange = (isLive) => {
    setIsGlobalLiveMode(isLive);
  };

  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeDashboardTab);
  }, [activeDashboardTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target)) {
        setIsRoomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Improved CO2 sensor detection with better validation
  const co2Sensors = useMemo(() => {
    if (!entities) return [];

    return Object.entries(entities)
      .filter(([key, entity]) => {
        if (!entity || typeof entity.state === 'undefined') return false;

        const isSensor = key.startsWith('sensor.');
        const hasCo2InName = key.toLowerCase().includes('co2') ||
                           key.toLowerCase().includes('carbon') ||
                           key.toLowerCase().includes('co₂');
        const hasValidValue = !isNaN(parseFloat(entity.state));

        return isSensor && hasCo2InName && hasValidValue;
      })
      .map(([key, entity]) => ({
        id: key,
        value: parseFloat(entity.state),
        unit: entity.attributes?.unit_of_measurement || 'ppm',
        entity_id: entity.entity_id || key,
        friendly_name: entity.attributes?.friendly_name || key.split('.').pop()
      }))
      .sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));
  }, [entities]);

  // Reset CO2 sensor selection when sensors change
  useEffect(() => {
    if (selectedCO2SensorIndex >= co2Sensors.length) {
      setSelectedCO2SensorIndex(0);
    }
  }, [co2Sensors.length, selectedCO2SensorIndex]);

  // Sensor IDs with better room handling
  const sensorIds = useMemo(() => {
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    return {
      vpd: `sensor.ogb_currentvpd_${room}`,
      temperature: `sensor.ogb_avgtemperature_${room}`,
      humidity: `sensor.ogb_avghumidity_${room}`
    };
  }, [currentRoom]);

  // Water sensor IDs
  const waterSensorIds = useMemo(() => {
    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    return {
      ph: `sensor.ogb_ph_${room}`,
      ec: `sensor.ogb_ec_${room}`,
      temp: `sensor.ogb_water_temp_${room}`,
      tankLevel: `sensor.ogb_tank_level_${room}`
    };
  }, [currentRoom]);

  // Detect water sensors dynamically
  const waterSensors = useMemo(() => {
    if (!entities) return {};

    const room = currentRoom?.trim()?.toLowerCase() || 'default';
    const sensors = {};

    Object.entries(entities).forEach(([key, entity]) => {
      const keyLower = key.toLowerCase();
      
      // pH sensors - look for 'ph' in sensor name
      if (keyLower.includes('ph') && !keyLower.includes('phase')) {
        sensors.ph = { id: key, ...entity };
      }
      
      // EC sensors
      if (keyLower.includes('ec_') || keyLower.includes('_ec') || keyLower.includes('tds')) {
        sensors.ec = { id: key, ...entity };
      }
      
      // ORP sensors
      if (keyLower.includes('orp')) {
        sensors.orp = { id: key, ...entity };
      }
      
      // TDS sensors (if not already matched as EC)
      if (keyLower.includes('tds') && !sensors.ec) {
        sensors.tds = { id: key, ...entity };
      }
      
      // Water temperature
      if ((keyLower.includes('water_temp') || keyLower.includes('water_temperature') || keyLower.includes('waterpump_temp')) && (keyLower.includes(room) || keyLower.includes('water'))) {
        sensors.temp = { id: key, ...entity };
      }
      
      // Tank/Reservoir Level
      if ((keyLower.includes('tank_level') || keyLower.includes('reservoir_level') || keyLower.includes('water_level')) && (keyLower.includes(room) || !keyLower.includes('_room'))) {
        sensors.tankLevel = { id: key, ...entity };
      }
    });

    return sensors;
  }, [entities, currentRoom]);

  // Detect energy sensors dynamically (Home Assistant Energy Dashboard compatible)
  const energySensors = useMemo(() => {
    if (!entities) return {};

    const sensors = {
      consumption: null,
      production: null,
      gridImport: null,
      gridExport: null,
      solar: null,
      battery: null,
      all: [],
    };

    Object.entries(entities).forEach(([key, entity]) => {
      if (!key.startsWith('sensor.')) return;

      const value = parseFloat(entity.state);
      if (isNaN(value) || value < 0) return;

      const keyLower = key.toLowerCase();
      const unit = entity.attributes?.unit_of_measurement || '';

      // Only kWh sensors for cumulative energy
      if (!unit.toLowerCase().includes('kwh')) return;

      const sensorData = {
        id: key,
        value,
        unit,
        friendlyName: entity.attributes?.friendly_name || key.split('.').pop(),
        category: 'energy',
      };

      sensors.all.push(sensorData);

      // Home Assistant Energy Dashboard entity patterns
      if (keyLower.includes('home_energy_consumption') || keyLower.includes('total_consumption')) {
        sensors.consumption = sensorData;
      }
      if (keyLower.includes('home_energy_production') || keyLower.includes('total_production')) {
        sensors.production = sensorData;
      }
      if (keyLower.includes('grid_import') || keyLower.includes('energy_import')) {
        sensors.gridImport = sensorData;
      }
      if (keyLower.includes('grid_export') || keyLower.includes('energy_export')) {
        sensors.gridExport = sensorData;
      }
      if (keyLower.includes('solar_energy') || keyLower.includes('solar_production')) {
        sensors.solar = sensorData;
      }
      if (keyLower.includes('battery_energy') || keyLower.includes('battery_charge')) {
        sensors.battery = sensorData;
      }

      // Fallback: use first consumption/production sensors if not found
      if (!sensors.consumption && (keyLower.includes('consumption') || keyLower.includes('usage'))) {
        sensors.consumption = sensorData;
      }
      if (!sensors.production && (keyLower.includes('production') || keyLower.includes('solar'))) {
        sensors.production = sensorData;
      }
    });

    return sensors;
  }, [entities]);

  // Loading and error states
  useEffect(() => {
    const checkConnection = () => {
      if (connectionState === 'connected') {
        setIsLoading(false);
        setError(null);
      } else if (connectionState === 'network_error' || connectionState === 'config_error') {
        setIsLoading(false);
        setError(`Connection issue: ${connectionState.replace('_', ' ')}`);
      } else if (connectionState === 'connecting') {
        setIsLoading(true);
        setError(null);
      }
    };

    checkConnection();
  }, [connectionState]);

  // Loading state
  if (isLoading) {
    return (
      <MainContainer>
        <ContainerHeader>
          <DashboardTitle firstText="OGB" secondText="Grow" thirdText="Monitor"/>
        </ContainerHeader>
        <LoadingState>
          <LoadingSpinner>
            <FaSpinner className="fa-spin" />
          </LoadingSpinner>
          <LoadingText>Connecting to Home Assistant...</LoadingText>
          <LoadingSubtext>Please wait while we establish connection</LoadingSubtext>
        </LoadingState>
        <BottomBar />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="OGB" secondText="Grow" thirdText="Monitor"/>
      </ContainerHeader>

      <TabContainer>
        <TabButton
          $active={activeDashboardTab === 'analytics'}
          onClick={() => setActiveDashboardTab('analytics')}
        >
          <MdDashboard size={18} />
          <TabLabel>Analytics</TabLabel>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'metrics'}
          onClick={() => setActiveDashboardTab('metrics')}
        >
          <MdInsights size={18} />
          <TabLabel>Metrics</TabLabel>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'water'}
          onClick={() => setActiveDashboardTab('water')}
        >
          <Droplets size={18} />
          <TabLabel>Water</TabLabel>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'cropsteering'}
          onClick={() => setActiveDashboardTab('cropsteering')}
        >
          <MdWaterDrop size={18} />
          <TabLabel>Crop Steering</TabLabel>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'energy'}
          onClick={() => setActiveDashboardTab('energy')}
        >
          <MdBolt size={18} />
          <TabLabel>Energy</TabLabel>
        </TabButton>
      </TabContainer>

      {activeDashboardTab === 'metrics' && (
        <MetricsSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <MetricsContent>
            <MediumProvider>
              <GrowMetrics />
            </MediumProvider>
          </MetricsContent>
        </MetricsSection>
      )}

      {activeDashboardTab === 'water' && (
        <WaterSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ChartGrid>
            {/* Combined Water Chart - First Chart */}
            <CombinedWaterChart
              waterSensors={waterSensors}
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={handleLiveModeChange}
            />

            {waterSensors.tankLevel && (
              <DashboardChart
                key={`tank-${waterSensors.tankLevel.id}`}
                sensorId={waterSensors.tankLevel.id}
                title="Reservoir Level"
                unit="%"
                priority="high"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
            {waterSensors.ph && (
              <DashboardChart
                key={`ph-${waterSensors.ph.id}`}
                sensorId={waterSensors.ph.id}
                title="pH"
                unit=""
                priority="high"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
            {waterSensors.ec && (
              <DashboardChart
                key={`ec-${waterSensors.ec.id}`}
                sensorId={waterSensors.ec.id}
                title="EC"
                unit="mS/cm"
                priority="high"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
            {waterSensors.temp && (
              <DashboardChart
                key={`temp-${waterSensors.temp.id}`}
                sensorId={waterSensors.temp.id}
                title="Water Temp"
                unit="°C"
                priority="medium"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
            {waterSensors.tds && (
              <DashboardChart
                key={`tds-${waterSensors.tds.id}`}
                sensorId={waterSensors.tds.id}
                title="TDS"
                unit="ppm"
                priority="medium"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
            {waterSensors.orp && (
              <DashboardChart
                key={`orp-${waterSensors.orp.id}`}
                sensorId={waterSensors.orp.id}
                title="ORP"
                unit="mV"
                priority="medium"
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
          </ChartGrid>
        </WaterSection>
      )}

      {activeDashboardTab === 'analytics' && (
        <AnalyticsSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ChartGrid>
            {/* Combined Climate Chart - First Chart */}
            <CombinedClimateChart
              sensorIds={sensorIds}
              co2Sensors={co2Sensors}
              selectedCO2SensorIndex={selectedCO2SensorIndex}
              onCO2SensorChange={setSelectedCO2SensorIndex}
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={handleLiveModeChange}
            />
            
            <DashboardChart
              sensorId={sensorIds.vpd}
              title="VPD"
              unit="kPa"
              priority="high"
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={handleLiveModeChange}
            />
            <DashboardChart
              sensorId={sensorIds.temperature}
              title="Avg Temp"
              unit="°C"
              priority="high"
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={handleLiveModeChange}
            />
            <DashboardChart
              sensorId={sensorIds.humidity}
              title="Avg Humidity"
              unit="%"
              priority="high"
              isGlobalLiveMode={isGlobalLiveMode}
              globalLiveRefreshTrigger={globalLiveRefreshTrigger}
              onLiveModeChange={handleLiveModeChange}
            />

            {co2Sensors.length > 0 && (
              <DashboardChart
                key={co2Sensors[selectedCO2SensorIndex]?.id}
                sensorId={co2Sensors[selectedCO2SensorIndex]?.entity_id}
                title="CO₂"
                unit={co2Sensors[selectedCO2SensorIndex]?.unit || 'ppm'}
                priority="medium"
                sensorOptions={co2Sensors.length > 1 ? co2Sensors : null}
                selectedSensorIndex={selectedCO2SensorIndex}
                onSensorChange={setSelectedCO2SensorIndex}
                isGlobalLiveMode={isGlobalLiveMode}
                globalLiveRefreshTrigger={globalLiveRefreshTrigger}
                onLiveModeChange={handleLiveModeChange}
              />
            )}
          </ChartGrid>

          {co2Sensors.length === 0 && (
            <EmptyState>
              <EmptyIcon><FaLeaf /></EmptyIcon>
              <EmptyTitle>No CO₂ Sensors Found</EmptyTitle>
              <EmptyMessage>
                CO₂ sensors will appear here when available in your Home Assistant setup.
              </EmptyMessage>
            </EmptyState>
          )}
        </AnalyticsSection>
      )}

      {activeDashboardTab === 'cropsteering' && (
        <CropSteeringContent
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <CropSteeringOverview 
            isGlobalLiveMode={isGlobalLiveMode}
            globalLiveRefreshTrigger={globalLiveRefreshTrigger}
            onLiveModeChange={handleLiveModeChange}
          />
        </CropSteeringContent>
      )}

      {activeDashboardTab === 'energy' && (
        <EnergySection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <EnergyHeader>
            <EnergyTitle>Energy Dashboard</EnergyTitle>
          </EnergyHeader>

          <RoomPowerSensors />
        </EnergySection>
      )}
      <BottomBar />
    </MainContainer>
  );
};

export default Dashboard;

// Loading, Error, and Empty States
const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  font-size: 3rem;
  color: var(--primary-accent, #007AFF);
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.h3`
  color: var(--main-text-color, #fff);
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 500;
`;

const LoadingSubtext = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0;
  font-size: 0.9rem;
`;


const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
`;

const EmptyTitle = styled.h3`
  color: var(--main-text-color, #fff);
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 500;
`;

const EmptyMessage = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0;
  font-size: 0.9rem;
  max-width: 300px;
`;

const MainContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 10vh;
  background: inherit;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding-bottom: 12vh; /* Account for larger bottom bar on mobile */
  }

  @media (max-width: 480px) {
    padding-bottom: 14vh;
  }
`;

const MainSection = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem;
  min-height: calc(100vh - 200px);

  @media (max-width: 1024px) {
    gap: 0.75rem;
    margin: 0.75rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0.5rem;
    min-height: calc(100vh - 250px);
  }

  @media (max-width: 480px) {
    margin: 0.5rem 0.25rem;
    gap: 0.5rem;
    min-height: calc(100vh - 280px);
  }
`;

const AnalyticsSection = styled(MainSection)`
  display: block;
`;

const MetricsSection = styled(MainSection)`
  display: block;
`;

const WaterSection = styled(MainSection)`
  display: block;
`;

const EnergySection = styled(MainSection)`
  display: block;
`;

const EnergyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-border-light);
`;

const EnergyTitle = styled.h2`
  color: var(--main-text-color);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const EnergyStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const EnergyStatCard = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--main-shadow-art);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    border-color: ${props => {
      switch(props.type) {
        case 'consumption': return 'var(--chart-error-color)';
        case 'production': return 'var(--chart-success-color)';
        case 'gridImport': return 'var(--warning-text-color)';
        case 'gridExport': return 'var(--chart-secondary-color)';
        case 'solar': return 'var(--chart-primary-color)';
        case 'battery': return 'var(--primary-accent)';
        default: return 'var(--primary-accent)';
      }
    }};
  }
`;

const EnergyStatIcon = styled.div`
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-shrink: 0;
`;

const EnergyStatContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const EnergyStatLabel = styled.div`
  color: var(--second-text-color);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EnergyStatValue = styled.div`
  color: var(--main-text-color);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
`;

const EnergyStatUnit = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--second-text-color);
  margin-left: 0.25rem;
`;

const EnergyStatEntity = styled.div`
  color: var(--second-text-color);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EnergyChartsSection = styled.div`
  margin-top: 2rem;
`;

const EnergyCardWrapper = styled.div`
  width: 100%;
  margin-top: 1.5rem;
  }

  @media (max-width: 1024px) {
    margin-top: 1rem;
  }
`;

const CropSteeringContent = styled(MainSection)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 260px);

  @media (max-width: 1024px) {
    min-height: calc(100vh - 280px);
  }
`;

const MetricsContent = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;

  @media (max-width: 768px) {
    width: 100%;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 1rem 0;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 14px;
  padding: 0.4rem;
  justify-content: center;
  width: calc(100% - 2rem);

  @media (max-width: 768px) {
    margin: 0.25rem 0.5rem 0;
    gap: 0.25rem;
    padding: 0.25rem;
    width: calc(100% - 1rem);
  }

  @media (max-width: 480px) {
    margin: 0.2rem 0.25rem 0;
    gap: 0.15rem;
    padding: 0.2rem;
    border-radius: 10px;
    width: calc(100% - 0.5rem);
  }
`;

const TabButton = styled.button`
  border: none;
  background: ${props => props.$active ? 'var(--primary-button-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--main-text-color)' : 'var(--second-text-color)'};
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: var(--main-text-color);
    background: ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-bg-secondary)'};
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.7rem;
    font-size: 0.75rem;
  }

  @media (max-width: 600px) {
    padding: 0.5rem 0.6rem;
    gap: 0.2rem;
    font-size: 0.7rem;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.5rem;
    min-width: 44px;
    height: 44px;
  }

  @media (max-width: 360px) {
    padding: 0.35rem 0.4rem;
    min-width: 40px;
    height: 40px;
  }
`;

const TabLabel = styled.span`
  display: block;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const CropWelcomeCard = styled.div`
  width: min(760px, 100%);
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
  box-shadow: var(--main-shadow-art);

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const DevBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  background: rgba(0, 255, 127, 0.1);
  font-size: 0.82rem;
  font-weight: 700;
`;

const CropWelcomeTitle = styled.h2`
  margin: 0 0 0.65rem;
  color: var(--main-text-color);
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 800;
`;

const CropWelcomeText = styled.p`
  margin: 0.35rem 0;
  color: var(--second-text-color);
  font-size: 1rem;
  line-height: 1.55;
`;

const ChartGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const ContainerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 3.5vh;
  min-height: 50px;
  margin-bottom: 0.5rem;
  padding: 0 2rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  gap: 1rem;
  position: relative;
  z-index: 1000;

  @media (max-width: 768px) {
    padding: 0 1rem;
    height: 4vh;
    min-height: 45px;
  }

  @media (max-width: 480px) {
    padding: 0 0.75rem;
    height: 4.5vh;
    min-height: 40px;
  }
`;
