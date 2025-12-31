import { useEffect, useState, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import DashboardChart from '../Components/Dashboard/DashboardChart';

import BottomBar from '../Components/Navigation/BottomBar';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import GrowMetrics from '../Components/Dashboard/GrowMetrics';
import { MediumProvider } from '../Components/Context/MediumContext';
import { FaExclamationTriangle, FaSpinner, FaLeaf, FaChevronDown } from 'react-icons/fa';
const Dashboard = () => {
  const { currentRoom, entities, connectionState, connection } = useHomeAssistant();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [selectedCO2SensorIndex, setSelectedCO2SensorIndex] = useState(0);
  const roomDropdownRef = useRef(null);

  // Get available rooms
  const roomOptions = useMemo(() => {
    const allRooms = Object.entries(entities)
      .filter(([key]) => key.startsWith("select.ogb_rooms"))
      .flatMap(([_, entity]) => entity.attributes?.options || [])
      .filter(r => r.toLowerCase() !== "ambient");

    const roomsWithSensors = allRooms.filter(room => {
      const hasSensors = Object.keys(entities).some(entityId => 
        entityId.startsWith('sensor.ogb_') && 
        entityId.toLowerCase().includes(room.toLowerCase())
      );
      return hasSensors;
    });

    return [...new Set(roomsWithSensors)];
  }, [entities]);

  // Handle room change
  const handleRoomChange = async (selectedRoom) => {
    const roomEntity = Object.entries(entities).find(([key]) =>
      key.startsWith('select.ogb_rooms')
    );

    if (roomEntity && connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'select',
          service: 'select_option',
          service_data: {
            entity_id: roomEntity[0],
            option: selectedRoom,
          },
        });
        setIsRoomDropdownOpen(false);
      } catch (error) {
        console.error('Error updating room:', error);
      }
    }
  };

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

  // Error state
  if (error) {
    return (
      <MainContainer>
        <ContainerHeader>
          <DashboardTitle firstText="OGB" secondText="Grow" thirdText="Monitor"/>
        </ContainerHeader>
        <ErrorState>
          <ErrorIcon>
            <FaExclamationTriangle />
          </ErrorIcon>
          <ErrorTitle>Connection Error</ErrorTitle>
          <ErrorMessage>{error}</ErrorMessage>
          <ErrorAction onClick={() => window.location.reload()}>
            Retry Connection
          </ErrorAction>
        </ErrorState>
        <BottomBar />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="OGB" secondText="Grow" thirdText="Monitor"/>
        
        {roomOptions.length > 0 && (
          <RoomSelector ref={roomDropdownRef}>
            <RoomButton onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}>
              <RoomName>{currentRoom || 'Select Room'}</RoomName>
              <FaChevronDown style={{ 
                transform: isRoomDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', 
                transition: 'transform 0.2s ease' 
              }} />
            </RoomButton>
            
            {isRoomDropdownOpen && (
              <RoomDropdown
                as={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {roomOptions.map((room, index) => (
                  <RoomOption 
                    key={index} 
                    $isActive={room === currentRoom}
                    onMouseDown={() => handleRoomChange(room)}
                  >
                    {room}
                  </RoomOption>
                ))}
              </RoomDropdown>
            )}
          </RoomSelector>
        )}
      </ContainerHeader>

      <InnerContent
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <MainSection>
          <MediumProvider>
            <GrowMetrics room={currentRoom}/>
          </MediumProvider>
        </MainSection>

        <DataSection>
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
        </DataSection>
      </InnerContent>
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

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: var(--chart-error-color, #dc3545);
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  color: var(--main-text-color, #fff);
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  color: var(--second-text-color, #ccc);
  margin: 0 0 2rem 0;
  font-size: 1rem;
  max-width: 400px;
`;

const ErrorAction = styled.button`
  background: var(--primary-accent, #007AFF);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: var(--primary-accent-hover, #0056CC);
  }
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

const InnerContent = styled.div`
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

const MainSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 6;
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 5;
  }

  @media (max-width: 768px) {
    width: 100%;
    flex: 1;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const DataSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 4;
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 5;
  }

  @media (max-width: 768px) {
    width: 100%;
    flex: 1;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
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

const RoomSelector = styled.div`
  position: relative;
  z-index: 1001;
`;

const RoomButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--main-text-color);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
  }

  @media (max-width: 480px) {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.375rem;
  }
`;

const RoomName = styled.span`
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 480px) {
    max-width: 80px;
  }
`;

const RoomDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 150px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const RoomOption = styled.div`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$isActive ? '#22c55e' : 'var(--main-text-color)'};
  background: ${props => props.$isActive ? 'rgba(34, 197, 94, 0.15)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;


