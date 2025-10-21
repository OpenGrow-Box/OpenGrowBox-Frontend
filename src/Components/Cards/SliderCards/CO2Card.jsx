import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import formatLabel from '../../../misc/formatLabel';
import HistoryChart from '../HistoryChart';

const CO2Card = ({pause,resume,isPlaying}) => {
  const { entities } = useHomeAssistant();
  const [co2Sensors, setCo2Sensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null); // State für ausgewählten Sensor (Modal)

  useEffect(() => {
    const updateCo2Sensors = () => {
      const sensors = Object.entries(entities)
        .filter(
          ([key, entity]) =>
            key.startsWith('sensor.') &&
            (key.toLowerCase().includes('_co2') || key.toLowerCase().includes('_carbondioxide')) &&
            !isNaN(parseFloat(entity.state))
        )
        .map(([key, entity]) => ({
          id: key,
          value: parseFloat(entity.state),
          unit: entity.attributes?.unit_of_measurement || 'ppm',
          friendlyName: formatLabel(entity.attributes?.friendly_name || key),
          entity_id: entity.entity_id,
        }));
      setCo2Sensors(sensors);
    };
    updateCo2Sensors();
  }, [entities]);

  // Funktion, die die Farbe basierend auf dem CO₂-Wert bestimmt
  const getColorForValue = (value) => {
    if (value < 400) return '#34d399';
    if (value >= 400 && value <= 800) return '#34d399';
    if (value > 800 && value <= 1200) return '#fbbf24';
    if (value > 1200 && value <= 1500) return '#ff0000';
    return '#ff000';
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
      <Header>
        <h4>CO₂</h4>
      </Header>
      <Content>
        {co2Sensors.map((sensor) => (
          <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.entity_id)}>
            <Label>{sensor.friendlyName}</Label>
            <ValueWrapper>
              <Value style={{ color: getColorForValue(sensor.value) }}>
                {sensor.value}
              </Value>
              <Unit>{sensor.unit}</Unit>
            </ValueWrapper>
          </DataBox>
        ))}
        {co2Sensors.length === 0 && <NoData>No CO₂ sensors found.</NoData>}
      </Content>

      {/* Bedingtes Rendern des Modal */}
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

export default CO2Card;

const CardContainer = styled.div`
  position: relative;
`;

const Header = styled.div`
  font-size: 0.8rem;
  color: var(--main-unit-color);
  margin-top: -2rem;
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 11;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: #fff;
  width: 65%;
  height: 65%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

