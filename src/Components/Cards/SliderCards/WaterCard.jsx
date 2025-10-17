import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import formatLabel from '../../../misc/formatLabel';
import HistoryChart from '../HistoryChart';

const WaterCard = ({pause,resume,isPlaying}) => {
  const { entities } = useHomeAssistant();
  const [phSensors, setPHSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null); // State für den ausgewählten Sensor

  useEffect(() => {
    const updatePHCard = () => {
      const sensors = Object.entries(entities)
      .filter(([key, entity]) => {
        const rawValue = parseFloat(entity.state);
        const id = key.toLowerCase();

        // Allowed sensor patterns
        const patterns = [
          /water/,                // Matches anywhere
          /wasser/,               // Matches anywhere
          /_ph($|[^a-z])/,        // Exact _ph
          /_sal($|[^a-z])/,       // Exact _sal
          /_oxidation($|[^a-z])/, // Exact _oxidation
          /_orp($|[^a-z])/,       // Exact _orp
          /_tds($|[^a-z])/,       // Exact _tds
          /_ec($|[^a-z])/,        // Exact _ec
        ];

        const matchesSensorType = patterns.some((pattern) => pattern.test(id));

        return (
          key.startsWith('sensor.') &&
          matchesSensorType &&
          !id.includes('phone') &&
          !id.includes('mqtt') &&
          !id.includes('connect') &&
          !id.includes('soil') &&
          !id.includes('erde') &&
          !id.includes('medium') &&
          !isNaN(rawValue) &&
          rawValue !== 0
        );
      })
        .map(([key, entity]) => {
          const rawValue = parseFloat(entity.state);
          const unit = entity.attributes?.unit_of_measurement || 'mS/cm';
          return {
            id: key,
            value: rawValue,
            unit: unit,
            friendlyName: formatLabel(entity.attributes?.friendly_name || key),
          };
        });

      setPHSensors(sensors);
    };

    updatePHCard();
  }, [entities]);

  const getColorForValue = (value, unit) => {
    const unitLower = unit.toLowerCase();
  
    // Farben für pH-Werte
    if (unitLower.includes('ph')) {
      if (value < 4.5) return '#ef4444'; // Sehr sauer (Rot)
      if (value >= 4.5 && value < 5.5) return 'rgba(230, 63, 12, 0.85)'; 
      if (value >= 5.5 && value < 6.0) return 'rgba(230, 212, 12, 0.85)'; 
      if (value >= 6.0 && value <= 7.0) return 'rgba(85, 230, 12, 0.85)';
      if (value > 7.0 && value <= 7.5) return 'rgba(197, 230, 12, 0.85)'; 
      if (value > 7.5 && value <= 8.5) return 'rgba(12, 170, 230, 0.85)';
      return '#60a5fa'; // Stark alkalisch (Dunkelblau)
    }
  
    // Farben für EC/TDS/Salinity
    if (unitLower.includes('ms/cm') || unitLower.includes('ms/us') || unitLower.includes('salinity')) {
      if (value < 100) return '#60a5fa'; // Sehr niedrige Leitfähigkeit (Dunkelblau)
      if (value >= 100 && value <= 500) return 'rgba(85, 230, 12, 0.85)';
      if (value > 500 && value <= 1500) return 'rgba(197, 230, 12, 0.85)'; 
      if (value > 1500 && value <= 2500) return 'rgba(230, 212, 12, 0.85)';
      if (value > 2500) return 'rgba(230, 63, 12, 0.85)'; 
    }
    if (unitLower.includes('ppm')) {
        if (value < 50) return '#60a5fa'; // Sehr niedrige Leitfähigkeit (Dunkelblau)
        if (value >= 50 && value <= 250) return 'rgba(85, 230, 12, 0.85)';
        if (value > 250 && value <= 750) return 'rgba(197, 230, 12, 0.85)'; 
        if (value > 750 && value <= 1250) return 'rgba(230, 212, 12, 0.85)';
        if (value > 1250) return 'rgba(230, 63, 12, 0.85)'; 
      }
    if (unitLower.includes('celcius') ||unitLower.includes('°C') ||  unitLower.includes('tds') || unitLower.includes('ec') || unitLower.includes('salinity')) {
        if (value < 10) return '#60a5fa'; // Sehr niedrige Leitfähigkeit (Dunkelblau)
        if (value >= 10 && value <= 15) return 'rgba(12, 226, 230, 0.86)'; 
        if (value > 15 && value <= 20) return 'rgba(12, 230, 165, 0.85)'; 
        if (value > 20 && value <= 25) return 'rgba(230, 212, 12, 0.85)'; 
        if (value > 25) return 'rgba(230, 63, 12, 0.85)';
      }
    return '#ffffff'; // Standard: Weiß (falls nichts zutrifft)
  };

  const formatValue = (value) => {
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
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
      <Header><h4>WATER</h4></Header>
      <Content>
        {phSensors.map((sensor) => (
          <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
            <Label>{sensor.friendlyName}</Label>
            <ValueWrapper>
              <Value style={{ color: getColorForValue(sensor.value, sensor.unit) }}>
                {formatValue(sensor.value)}
              </Value>
              <Unit>{sensor.unit}</Unit>
            </ValueWrapper>
          </DataBox>
        ))}
        {phSensors.length === 0 && <NoData>No Water sensors found.</NoData>}
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

export default WaterCard;

const CardContainer = styled.div``;

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
