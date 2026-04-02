import { useEffect, useState, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MdDashboard, MdWaterDrop, MdInsights, MdBolt } from 'react-icons/md';
import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import DashboardChart from '../Components/Dashboard/DashboardChart';

import BottomBar from '../Components/Navigation/BottomBar';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import GrowMetrics from '../Components/Dashboard/GrowMetrics';
import { MediumProvider } from '../Components/Context/MediumContext';
import { FaSpinner, FaLeaf } from 'react-icons/fa';


const Dashboard = () => {
  const { currentRoom, entities, connectionState } = useHomeAssistant();
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState(null);
  const [ setIsRoomDropdownOpen] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState(() => localStorage.getItem('dashboardActiveTab') || 'analytics');
  const [selectedCO2SensorIndex, setSelectedCO2SensorIndex] = useState(0);
  const roomDropdownRef = useRef(null);

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
          <span>Analytics</span>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'metrics'}
          onClick={() => setActiveDashboardTab('metrics')}
        >
          <MdInsights size={18} />
          <span>Metrics</span>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'cropsteering'}
          onClick={() => setActiveDashboardTab('cropsteering')}
        >
          <MdWaterDrop size={18} />
          <span>Crop Steering</span>
        </TabButton>
        <TabButton
          $active={activeDashboardTab === 'energy'}
          onClick={() => setActiveDashboardTab('energy')}
        >
          <MdBolt size={18} />
          <span>Energy Consumption</span>
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

      {activeDashboardTab === 'analytics' && (
        <AnalyticsSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ChartGrid>
            <DashboardChart
              sensorId={sensorIds.vpd}
              title="VPD"
              unit="kPa"
              priority="high"
            />
            <DashboardChart
              sensorId={sensorIds.temperature}
              title="Avg Temp"
              unit="°C"
              priority="high"
            />
            <DashboardChart
              sensorId={sensorIds.humidity}
              title="Avg Humidity"
              unit="%"
              priority="high"
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
        <CropSteeringSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <CropWelcomeCard>
            <DevBadge>
              <MdWaterDrop size={16} /> In Development
            </DevBadge>
            <CropWelcomeTitle>Welcome to Crop Steering</CropWelcomeTitle>
            <CropWelcomeText>
              This dashboard is under active development and will launch soon.
            </CropWelcomeText>
            <CropWelcomeText>
              You will get phase insights, dry-back tracking, and steering actions in one place.
            </CropWelcomeText>
          </CropWelcomeCard>
        </CropSteeringSection>
      )}

      {activeDashboardTab === 'energy' && (
        <CropSteeringSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <CropWelcomeCard>
            <DevBadge>
              <MdBolt size={16} /> In Development
            </DevBadge>
            <CropWelcomeTitle>Energy Consumption</CropWelcomeTitle>
            <CropWelcomeText>
              This dashboard is under active development and will be available soon.
            </CropWelcomeText>
            <CropWelcomeText>
              You will get consumption history, peak usage windows, and device-level energy insights.
            </CropWelcomeText>
          </CropWelcomeCard>
        </CropSteeringSection>
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

const CropSteeringSection = styled(MainSection)`
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
  gap: 0.5rem;
  margin: 0.5rem 1rem 0;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 14px;
  padding: 0.4rem;

  @media (max-width: 768px) {
    margin: 0.25rem 0.5rem 0;
  }
`;

const TabButton = styled.button`
  border: none;
  background: ${props => props.$active ? 'var(--primary-button-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--main-text-color)' : 'var(--second-text-color)'};
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--main-text-color);
    background: ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-bg-secondary)'};
  }
`;

const CropWelcomeCard = styled.div`
  width: min(760px, 100%);
  background: linear-gradient(145deg, rgba(11, 40, 58, 0.7), rgba(20, 61, 39, 0.55));
  border: 1px solid var(--glass-border-light);
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);

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
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
  background: rgba(2, 132, 199, 0.15);
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
