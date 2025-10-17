import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import formatLabel from '../../../misc/formatLabel';
import HistoryChart from '../HistoryChart';

const SoilCard = ({ pause, resume, isPlaying }) => {
  const { entities } = useHomeAssistant();
  const [ecSensors, setEcSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);

  useEffect(() => {
    const updateCard = () => {
      const sensors = Object.entries(entities)
        .filter(
          ([key, entity]) =>
            key.startsWith('sensor.') &&
            (key.toLowerCase().includes('soil') ||
              key.toLowerCase().includes('boden') ||
              key.toLowerCase().includes('_moisture') ||
              key.toLowerCase().includes('_conductivity')) &&
            !key.toLowerCase().includes('wifi') &&
            !key.toLowerCase().includes('mqtt') &&
            !key.toLowerCase().includes('connect') &&
            !key.toLowerCase().includes('batter') &&
            !key.toLowerCase().includes('power') &&
            !key.toLocaleLowerCase().includes('_temperature') &&
            !key.toLocaleLowerCase().includes('_lux') &&
            !key.toLocaleLowerCase().includes('_lumen') &&
            !key.toLocaleLowerCase().includes('_illuminance') &&
            !isNaN(parseFloat(entity.state))
        )
        .map(([key, entity]) => {
          const rawValue = parseFloat(entity.state);
          const unit = entity.attributes?.unit_of_measurement || '%';

          let value = rawValue;
          let displayUnit = unit;

          // Konvertierung nur für Leitfähigkeit
          if (unit === 'µS/cm') {
            value = rawValue / 1000;
            displayUnit = 'mS/cm';
          }

          return {
            id: key,
            value,
            unit: displayUnit,
            friendlyName: formatLabel(entity.attributes?.friendly_name || key),
          };
        });

      setEcSensors(sensors);
    };

    updateCard();
  }, [entities]);

  // Farb-Logik nach Einheit
  const getColorForValue = (value, unit) => {
    if (unit === '%' || unit.toLowerCase().includes('moisture')) {
      // Feuchtigkeit
      if (value < 20) return '#60a5fa'; // sehr trocken
      if (value >= 20 && value <= 40) return 'rgba(230, 212, 12, 0.85)'; // niedrig
      if (value > 40 && value <= 70) return 'rgba(85, 230, 12, 0.85)'; // optimal
      if (value > 70 && value <= 90) return 'rgba(197, 230, 12, 0.85)'; // hoch
      return '#ef4444'; // extrem nass
    } else {
      // EC-Wert
      if (value < 0.1) return '#60a5fa'; // sehr niedrig
      if (value >= 0.1 && value <= 0.5) return 'rgba(85, 230, 12, 0.85)'; // optimal
      if (value > 0.5 && value <= 1.0) return 'rgba(197, 230, 12, 0.85)'; // mittel
      if (value > 1.0 && value <= 1.5) return 'rgba(230, 212, 12, 0.85)'; // hoch
      if (value > 1.5 && value <= 2.5) return 'rgba(230, 63, 12, 0.85)'; // sehr hoch
      return '#ef4444'; // extrem hoch
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
      <Header><h4>SOIL</h4></Header>
      <Content>
        {ecSensors.map((sensor) => (
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
        {ecSensors.length === 0 && <NoData>No sensors found.</NoData>}
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

export default SoilCard;

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
