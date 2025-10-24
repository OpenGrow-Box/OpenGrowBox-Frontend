import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import formatLabel from '../../../misc/formatLabel';
import HistoryChart from '../HistoryChart';
import { classifyAndNormalize } from './sensorClassifier';

const AllTemps = ({ pause, resume, isPlaying }) => {
  const { entities } = useHomeAssistant();
  const [allTempSensors, setAllTempSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);


  useEffect(() => {
    const normalizedSensors = classifyAndNormalize(entities)
      .filter(s => 
        (s.category === "temperature" ) && 
        s.context === "air"  // ← Hier der zusätzliche Filter!
      );

    setAllTempSensors(normalizedSensors);
  }, [entities]);


  const getColorForValue = (value) => {
    if (value < 10) return '#34d399'; // Grün für sehr niedrige Werte unter 10°C
    if (value >= 10 && value <= 18) return '#00aaff'; // Blau für Werte zwischen 10 und 18°C
    if (value > 18 && value <= 25) return '#fbbf24'; // Gelb
    if (value > 25 && value <= 35) return '#fb923c'; // Orange
    if (value > 35 && value <= 40) return '#ef4444'; // Rot
    return '#7f1d1d'; // Dunkelrot für sehr hohe Werte über 40°C
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
      <Header><h4>ALL TEMPERATURES</h4></Header>
      <Content>
        {allTempSensors.map((sensor) => (
          <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
            <Label>{sensor.friendlyName}</Label>
            <ValueWrapper>
              <Value style={{ color: getColorForValue(sensor.value, sensor.unit) }}>
                {sensor.value.toFixed(2)}
              </Value>
              <Unit>{sensor.unit}</Unit>
            </ValueWrapper>
          </DataBox>
        ))}
        {allTempSensors.length === 0 && <NoData>No sensors found.</NoData>}
      </Content>

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

export default AllTemps;

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
