import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import HistoryChart from '../HistoryChart';

const LightIntensity = ({pause,resume}) => {
  const { entities } = useHomeAssistant();
  const [lightIntesity, setLightIntensity] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const formatLabel = (label) => {
    return label
      .replace(/^OGB_VPDCurrent/, '') 
      .replace(/_/g, ' ') 
      .replace(/([a-z])([A-Z])/g, '$1 $2') 
      .toLowerCase() 
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  useEffect(() => {
    const LightIntensityCheck = () => {
      const sensors = Object.entries(entities)
        .filter(([key, entity]) => {
          const isValidDomain = key.startsWith('number.') || key.startsWith('sensor.') || key.startsWith('switch.');
          const isIntensity = key.toLowerCase().includes('intensity');
          const hasState = entity?.state !== undefined;
          return isIntensity && isValidDomain && hasState;
        })
        .map(([key, entity]) => {
          let value = parseFloat(entity.state);
          let unit = entity.attributes?.unit_of_measurement || '';
          
          // Sonderbehandlung für Volt → Prozent
          if (unit.toLowerCase() === 'v') {
            value = value * 10; // 0-10V → 0-100%
            unit = '%';
          }

          return {
            id: key,
            value: value,
            unit: unit,
            friendlyName: formatLabel(entity.attributes?.friendly_name || key),
            entity_id: entity.entity_id,
          };
        });

      setLightIntensity(sensors);
    };

    LightIntensityCheck();
  }, [entities]);

  const handleDataBoxClick = (sensorId) => {
    pause(); 
    setSelectedSensor(sensorId);
  };

  const closeHistoryChart = () => {
    setSelectedSensor(null);
    resume(); 
  };

  const getColorForValue = (value) => {
    if (value < 0) return '#60a5fa'; 
    if (value >= 0 && value <= 10) return 'rgb(11, 234, 212)'; 
    if (value >= 10 && value <= 25) return 'rgb(11, 149, 234)'; 
    if (value >= 25 && value <= 50) return 'rgb(11, 234, 123)'; 
    if (value >= 50 && value <= 70) return 'rgb(149, 234, 11)';
    if (value >= 70 && value <= 80) return 'rgb(234, 197, 11)';
    if (value >= 80 && value <= 90) return 'rgb(234, 141, 11)';
    if (value >= 90 && value <= 100) return 'rgb(234, 82, 11)'; 
    return '#ef4444'; 
  };

  return (
    <CardContainer>
      <Header><h3>Light Intensity</h3></Header>
      <Content>
        {lightIntesity.map((sensor) => (
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
        {lightIntesity.length === 0 && <NoData>No Intensity Sensors found.</NoData>}
      </Content>

      {/* Bedingtes Rendern des Modals */}
      {selectedSensor && (
        <ModalOverlay onClick={closeHistoryChart}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <HistoryChart sensorId={selectedSensor} onClose={closeHistoryChart} />
            <CloseButton onClick={closeHistoryChart}>X</CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </CardContainer>
  );
};

export default LightIntensity;

const CardContainer = styled.div`
  position: relative;
`;

const Header = styled.div`
  font-size: 0.8rem;
  color: var(--main-unit-color);
  margin-top: -2rem;
`;

const Content = styled.div``;

const DataBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
  min-width: 100%;
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
  height: 55%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;


const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--main-text-color);
`;
