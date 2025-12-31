import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FaCog, FaTimes, FaChartLine } from 'react-icons/fa';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { classifyAndNormalize } from './SliderCards/sensorClassifier';
import HistoryChart from './HistoryChart';
import { getThemeColor } from '../../utils/themeColors';

const STORAGE_KEY = 'ogb_other_sensors_config';

const OtherSensors = () => {
  const { entities } = useHomeAssistant();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [selectedForHistory, setSelectedForHistory] = useState(null);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setSelectedSensors(config.selectedSensors || []);
      } catch (e) {
        console.error('Failed to load OtherSensors config:', e);
      }
    }
  }, []);

  // Get all available sensors from classifier
  const availableSensors = useMemo(() => {
    return classifyAndNormalize(entities);
  }, [entities]);

  // Group sensors by category
  const sensorsByCategory = useMemo(() => {
    return availableSensors.reduce((acc, sensor) => {
      if (!acc[sensor.category]) {
        acc[sensor.category] = [];
      }
      acc[sensor.category].push(sensor);
      return acc;
    }, {});
  }, [availableSensors]);

  // Get only selected sensors with current values
  const displayedSensors = useMemo(() => {
    return availableSensors.filter(sensor => 
      selectedSensors.includes(sensor.id)
    );
  }, [availableSensors, selectedSensors]);

  // Group displayed sensors by category
  const displayedByCategory = useMemo(() => {
    return displayedSensors.reduce((acc, sensor) => {
      if (!acc[sensor.category]) {
        acc[sensor.category] = [];
      }
      acc[sensor.category].push(sensor);
      return acc;
    }, {});
  }, [displayedSensors]);

  const saveConfiguration = () => {
    const config = {
      selectedSensors,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setIsConfiguring(false);
  };

  const toggleSensorSelection = (sensorId) => {
    setSelectedSensors(prev => {
      if (prev.includes(sensorId)) {
        return prev.filter(id => id !== sensorId);
      } else {
        return [...prev, sensorId];
      }
    });
  };

  const formatCategoryName = (category) => {
    const names = {
      temperature: '🌡️ Temperature',
      humidity: '💧 Humidity',
      co2: '🌿 CO₂',
      moisture: '🌱 Soil Moisture',
      vpd: '💨 VPD',
      ec: '⚡ EC',
      ph: '🧪 pH',
      light: '💡 Light',
      dewpoint: '🌫️ Dew Point',
      pressure: '🌀 Pressure',
      tds: '💎 TDS',
      oxidation: '⚗️ ORP',
      salinity: '🧂 Salinity',
      weight: '⚖️ Weight'
    };
    return names[category] || category.toUpperCase();
  };

  const getColorForCategory = (category, value) => {
    switch (category) {
      case 'temperature':
        if (value < 10) return getThemeColor('--chart-primary-color');
        if (value <= 18) return getThemeColor('--chart-success-color');
        if (value <= 25) return getThemeColor('--chart-warning-color');
        if (value <= 35) return getThemeColor('--warning-text-color');
        return getThemeColor('--chart-error-color');
      
      case 'humidity':
        if (value < 30) return getThemeColor('--chart-error-color');
        if (value <= 40) return getThemeColor('--warning-text-color');
        if (value <= 70) return getThemeColor('--chart-success-color');
        if (value <= 80) return getThemeColor('--warning-text-color');
        return getThemeColor('--chart-error-color');
      
      case 'co2':
        if (value < 400) return getThemeColor('--chart-primary-color');
        if (value <= 1000) return getThemeColor('--chart-success-color');
        if (value <= 1500) return getThemeColor('--warning-text-color');
        return getThemeColor('--chart-error-color');
      
      case 'ph':
        if (value < 5.5 || value > 7.0) return getThemeColor('--chart-error-color');
        if (value < 6.0 || value > 6.5) return getThemeColor('--warning-text-color');
        return getThemeColor('--chart-success-color');
      
      default:
        return getThemeColor('--main-text-color');
    }
  };

  const openHistoryChart = (sensorId) => {
    setSelectedForHistory(sensorId);
  };

  const closeHistoryChart = () => {
    setSelectedForHistory(null);
  };

  // Empty state - no sensors configured
  if (selectedSensors.length === 0 && !isConfiguring) {
    return (
      <Container>
        <Header>
          <Title>Other Sensors</Title>
          <ConfigButton onClick={() => setIsConfiguring(true)}>
            <FaCog /> Configure
          </ConfigButton>
        </Header>
        <EmptyState>
          <EmptyIcon><FaCog size={48} /></EmptyIcon>
          <EmptyTitle>No sensors configured</EmptyTitle>
          <EmptyMessage>
            Click "Configure" to select which sensors you want to monitor here
          </EmptyMessage>
        </EmptyState>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Header>
          <Title>Other Sensors</Title>
          <ConfigButton onClick={() => setIsConfiguring(true)}>
            <FaCog /> Edit
          </ConfigButton>
        </Header>

        {!isConfiguring && (
          <Content>
            {Object.entries(displayedByCategory).map(([category, sensors]) => (
              <CategorySection key={category}>
                <CategoryTitle>{formatCategoryName(category)}</CategoryTitle>
                <SensorGrid>
                  {sensors.map(sensor => (
                    <SensorCard 
                      key={sensor.id}
                      onClick={() => openHistoryChart(sensor.id)}
                    >
                      <SensorName>{sensor.friendlyName}</SensorName>
                      <SensorValue color={getColorForCategory(category, sensor.value)}>
                        {sensor.value.toFixed(2)} {sensor.unit}
                      </SensorValue>
                      <ContextBadge>{sensor.context}</ContextBadge>
                      <HistoryIcon><FaChartLine size={12} /></HistoryIcon>
                    </SensorCard>
                  ))}
                </SensorGrid>
              </CategorySection>
            ))}
            {displayedSensors.length === 0 && (
              <NoData>No sensor data available</NoData>
            )}
          </Content>
        )}

        {isConfiguring && (
          <ConfigModal>
            <ModalHeader>
              <ModalTitle>Select Sensors to Monitor</ModalTitle>
              <CloseButton onClick={() => setIsConfiguring(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <ModalContent>
              <SensorCount>
                {selectedSensors.length} sensor{selectedSensors.length !== 1 ? 's' : ''} selected
              </SensorCount>
              
              {Object.entries(sensorsByCategory).map(([category, sensors]) => (
                <ConfigCategorySection key={category}>
                  <ConfigCategoryTitle>{formatCategoryName(category)}</ConfigCategoryTitle>
                  <SensorList>
                    {sensors.map(sensor => (
                      <SensorListItem key={sensor.id}>
                        <Checkbox
                          type="checkbox"
                          checked={selectedSensors.includes(sensor.id)}
                          onChange={() => toggleSensorSelection(sensor.id)}
                          id={`sensor-${sensor.id}`}
                        />
                        <SensorLabel htmlFor={`sensor-${sensor.id}`}>
                          <LabelName>{sensor.friendlyName}</LabelName>
                          <LabelInfo>
                            <LabelValue>
                              {sensor.value.toFixed(2)} {sensor.unit}
                            </LabelValue>
                            <LabelContext>{sensor.context}</LabelContext>
                          </LabelInfo>
                        </SensorLabel>
                      </SensorListItem>
                    ))}
                  </SensorList>
                </ConfigCategorySection>
              ))}

              {availableSensors.length === 0 && (
                <NoSensorsMessage>
                  No generic sensors found. Only OGB sensors are detected.
                </NoSensorsMessage>
              )}
            </ModalContent>

            <ModalFooter>
              <CancelButton onClick={() => setIsConfiguring(false)}>
                Cancel
              </CancelButton>
              <SaveButton onClick={saveConfiguration}>
                Save Configuration
              </SaveButton>
            </ModalFooter>
          </ConfigModal>
        )}
      </Container>

      {/* History Chart Modal */}
      {selectedForHistory && (
        <HistoryModalOverlay onClick={closeHistoryChart}>
          <HistoryModalContent onClick={(e) => e.stopPropagation()}>
            <HistoryChart sensorId={selectedForHistory} onClose={closeHistoryChart} />
          </HistoryModalContent>
        </HistoryModalOverlay>
      )}
    </>
  );
};

export default OtherSensors;

// Styled Components
const Container = styled.div`
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--main-bg-card-color);
  border-radius: 20px;
  box-shadow: var(--main-shadow-art);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    box-shadow: var(--main-shadow-hover);
  }

  @media (max-width: 640px) {
    padding: 1rem;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--main-text-color);

  @media (max-width: 640px) {
    font-size: 1.2rem;
  }
`;

const ConfigButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--cannabis-active-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  color: var(--main-unit-color);
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const EmptyMessage = styled.p`
  margin: 0;
  font-size: 1rem;
  opacity: 0.7;
  color: var(--main-text-color);
  max-width: 400px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CategorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CategoryTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-text-color);
  opacity: 0.8;
`;

const SensorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
`;

const SensorCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--main-bg-card-color);
  border-radius: 12px;
  box-shadow: var(--main-shadow-art);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--main-shadow-hover);
  }

  @media (max-width: 640px) {
    padding: 0.75rem;
  }
`;

const SensorName = styled.div`
  font-size: 0.85rem;
  color: var(--main-text-color);
  font-weight: 500;
  line-height: 1.3;
`;

const SensorValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.color || 'var(--main-text-color)'};
`;

const ContextBadge = styled.div`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.7;
  align-self: flex-start;
`;

const HistoryIcon = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;

  ${SensorCard}:hover & {
    opacity: 1;
  }
`;

const NoData = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--main-text-color);
  opacity: 0.6;
`;

const ConfigModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 70vh;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--main-text-color);
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.2rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SensorCount = styled.div`
  font-size: 0.9rem;
  color: var(--cannabis-active-color);
  font-weight: 600;
  padding: 0.5rem 0;
`;

const ConfigCategorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ConfigCategoryTitle = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--main-text-color);
  opacity: 0.8;
`;

const SensorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SensorListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--cannabis-active-color);
`;

const SensorLabel = styled.label`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  gap: 1rem;
`;

const LabelName = styled.div`
  font-size: 0.9rem;
  color: var(--main-text-color);
  font-weight: 500;
`;

const LabelInfo = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const LabelValue = styled.div`
  font-size: 0.85rem;
  color: var(--main-text-color);
  opacity: 0.8;
`;

const LabelContext = styled.div`
  font-size: 0.75rem;
  color: var(--main-text-color);
  opacity: 0.6;
  text-transform: uppercase;
`;

const NoSensorsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--main-text-color);
  opacity: 0.6;
  font-size: 0.95rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: var(--main-text-color);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: var(--cannabis-active-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const HistoryModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--main-bg-color);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HistoryModalContent = styled.div`
  background: var(--main-bg-card-color);
  width: 90%;
  max-width: 1200px;
  height: 80%;
  max-height: 800px;
  border-radius: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--main-shadow-art);

  @media (max-width: 768px) {
    width: 95%;
    height: 90%;
  }
`;
