import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import HistoryChart from '../HistoryChart';
import { getThemeColor } from '../../../utils/themeColors';
import { filterSensorsByRoom } from './sensorClassifier';

const TempCard = ({pause, resume, isPlaying, filterByRoom}) => {
  const { entities, currentRoom } = useHomeAssistant();
  const [tempSensors, setTempSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const formatLabel = (label) => {
    return label
      .replace(/^OGB_AVGTemperature/, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  useEffect(() => {
    let sensors = Object.entries(entities)
      .filter(
        ([key, entity]) =>
          key.startsWith('sensor.') &&
          (key.toLowerCase().includes('avgtemp')) &&
          !isNaN(parseFloat(entity.state))
      )
      .map(([key, entity]) => ({
        id: key,
        value: parseFloat(entity.state),
        unit: entity.attributes?.unit_of_measurement || '°C',
        friendlyName: formatLabel(entity.attributes?.friendly_name || key),
      }));

    // Filter by current room using HA device registry
    if (filterByRoom && currentRoom) {
      sensors = filterSensorsByRoom(sensors, currentRoom);
    }

    setTempSensors(sensors);
  }, [entities, filterByRoom, currentRoom]);

  // Funktion zur Bestimmung der Farbe basierend auf dem Temperatur-Wert
  const getColorForValue = (value) => {
    if (value < 10) return getThemeColor('--chart-success-color'); // Theme green für sehr niedrige Werte unter 10°C
    if (value >= 10 && value <= 18) return getThemeColor('--chart-primary-color'); // Theme blue für Werte zwischen 10 und 18°C
    if (value > 18 && value <= 25) return getThemeColor('--chart-warning-color'); // Theme yellow
    if (value > 25 && value <= 35) return getThemeColor('--warning-text-color'); // Theme orange
    if (value > 35 && value <= 40) return getThemeColor('--chart-error-color'); // Theme red
    return getThemeColor('--error-text-color'); // Theme dark red für sehr hohe Werte über 40°C
  };

  const handleDataBoxClick = (sensorId) => {
    pause(); 
    setSelectedSensor(sensorId);
  };

  const closeHistoryChart = () => {
    setSelectedSensor(null);
    if(isPlaying){
      resume(); 
    }
  };

  return (
    <CardContainer>
      <Header><h4>AVG TEMPERATURE</h4></Header>
      <Content>
        {tempSensors.map((sensor) => (
          <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
            <Label>{sensor.friendlyName}</Label>
            <ValueWrapper>
              <Value style={{ color: getColorForValue(sensor.value) }}>
                {sensor.value}
              </Value>
              <Unit>{sensor.unit}</Unit>
            </ValueWrapper>
          </DataBox>
        ))}
        {tempSensors.length === 0 && <NoData>No Temp sensors found.</NoData>}
      </Content>

      {/* Bedingtes Rendern des Modals */}
      {selectedSensor && (
        <ModalOverlay onClick={closeHistoryChart}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <HistoryChart sensorId={selectedSensor} onClose={closeHistoryChart} />
      
          </ModalContent>
        </ModalOverlay>
      )}
    </CardContainer>
  );
};

export default TempCard;

// Styled Components
const CardContainer = styled.div``;

const Header = styled.div`
  font-size: 0.8rem;
  color: var(--main-unit-color);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  @media (max-width: 768px) {
    transition: color 0.3s ease;
  }
`;

const Content = styled.div``;

const DataBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
  min-width: 100%;
  flex-direction: row;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
  margin-top: 0.5rem;
  color: var(--main-text-color);
  cursor: pointer;
`;

const ValueWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Label = styled.div``;

const Value = styled.div``;

const Unit = styled.div``;

const NoData = styled.div``;

// Modal-Styling
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 11;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: var(--main-bg-card-color);
  width: 65%;
  height: 65%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

