import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import HistoryChart from '../HistoryChart';
import { getThemeColor } from '../../../utils/themeColors';
import { filterSensorsByRoom } from './sensorClassifier';

const PPFDCard = ({ pause, resume, isPlaying, filterByRoom }) => {
  const { entities, currentRoom } = useHomeAssistant();
  const [tempSensors, setTempSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const formatLabel = (label) => {
    return label
      .replace(/^OGB_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  useEffect(() => {
    let sensors = Object.entries(entities)
      .filter(
        ([key, entity]) =>
          key.startsWith('sensor.ogb_') &&
          entity.state != 0 &&
          !key.toLowerCase().includes('ambient') &&
          (key.toLowerCase().includes('ppfd') || key.toLowerCase().includes('dli')) &&
          !isNaN(parseFloat(entity.state))
      )
      .map(([key, entity]) => ({
        id: key,
        value: parseFloat(entity.state),
        unit: entity.attributes?.unit_of_measurement || '',
        friendlyName: formatLabel(entity.attributes?.friendly_name || key),
      }));

    if (filterByRoom && currentRoom) {
      sensors = filterSensorsByRoom(sensors, currentRoom);
    }

    setTempSensors(sensors);
  }, [entities, filterByRoom, currentRoom]);

  // Farb-Logik abhängig von Sensortyp (PPFD oder DLI)
  const getColorForSensor = (sensorId, value) => {
    const lowerId = sensorId.toLowerCase();

    if (lowerId.includes('dli')) {
      // DLI Farben (z. B. mol/m²/day)
      if (value < 10) return getThemeColor('--chart-success-color'); // Theme green
      if (value >= 10 && value < 20) return getThemeColor('--chart-primary-color'); // Theme blue
      if (value >= 20 && value < 40) return getThemeColor('--chart-warning-color'); // Theme yellow
      if (value >= 40 && value < 60) return getThemeColor('--warning-text-color'); // Theme orange
      if (value >= 60 && value < 80) return getThemeColor('--chart-error-color'); // Theme red
      return getThemeColor('--error-text-color'); // Theme dark red
    } else {
      // PPFD Farben (z. B. µmol/m²/s)
      if (value < 200) return getThemeColor('--chart-success-color'); // Theme green
      if (value >= 200 && value < 600) return getThemeColor('--chart-primary-color'); // Theme blue
      if (value >= 600 && value < 900) return getThemeColor('--chart-warning-color'); // Theme yellow
      if (value >= 900 && value < 1200) return getThemeColor('--warning-text-color'); // Theme orange
      if (value >= 1200 && value < 1500) return getThemeColor('--chart-error-color'); // Theme red
      return getThemeColor('--error-text-color'); // Theme dark red
    }
  };

  const handleDataBoxClick = (sensorId) => {
    pause();
    setSelectedSensor(sensorId);
  };

  const closeHistoryChart = () => {
    setSelectedSensor(null);
    if (isPlaying) {
      resume();
    }
  };

  return (
    <CardContainer>
      <Header><h4>PPFD / DLI </h4></Header>
      <Content>
        {tempSensors.map((sensor) => (
          <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
            <Label>{sensor.friendlyName}</Label>
            <ValueWrapper>
              <Value style={{ color: getColorForSensor(sensor.id, sensor.value) }}>
                {sensor.value}
              </Value>
              <Unit>{sensor.unit}</Unit>
            </ValueWrapper>
          </DataBox>
        ))}
        {tempSensors.length === 0 && <NoData>No PPFD/DLI sensors found.</NoData>}
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

export default PPFDCard;

// Styled Components
const CardContainer = styled.div``;

const Header = styled.div`
  font-size: 0.8rem;
  color: var(--main-unit-color);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  @media (max-width: 768px) {
    width: 10%;
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
  background: var(--main-bg-color);
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

