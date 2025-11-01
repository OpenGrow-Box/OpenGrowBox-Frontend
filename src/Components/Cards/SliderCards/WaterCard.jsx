import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import HistoryChart from '../HistoryChart';
import { classifyAndNormalize } from './sensorClassifier';



const WaterCard = ({pause,resume,isPlaying}) => {
  const { entities } = useHomeAssistant();
  const [waterSensors, setWaterensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null); // State für den ausgewählten Sensor

  useEffect(() => {
    const ogbOrpSensor = Object.entries(entities)
      .filter(
        ([key, entity]) =>
          key.startsWith('sensor.') &&
          key.toLowerCase().includes('waterorp') &&
          !isNaN(parseFloat(entity.state))
      )
      .map(([key, entity]) => ({
        id: key,
        value: parseFloat(entity.state),
        unit: entity.attributes?.unit_of_measurement || 'mV',
        friendlyName: entity.attributes?.friendly_name || key,
        category: 'oxidation',
        context: 'water',
      }));

    const normalizedSensors = classifyAndNormalize(entities)
      .filter(
        (s) =>
          ['ph', 'ec', 'tds', 'oxidation', 'salinity', 'temperature'].includes(s.category) &&
          s.context === 'water'
      );

    // 🔥 Hier kombinieren wir beides:
    const combinedSensors = [...normalizedSensors, ...ogbOrpSensor];

    setWaterensors(combinedSensors);
  }, [entities]);


  const getColorForValue = (value, unit) => {
    const unitLower = unit.toLowerCase();
    let normalizedValue = value;

    // Einheitskonvertierung für EC/Leitfähigkeit
    if (unitLower.includes('µs') || unitLower.includes('us') || unitLower.includes('ms/us')) {
      // µS/cm, µS/us oder ms/us zu mS konvertieren (1 mS = 1000 µS)
      normalizedValue = value / 1000;
    }

    // Farben für pH-Werte
    if (unitLower.includes('ph')) {
      if (normalizedValue < 4.5) return '#ef4444';
      if (normalizedValue >= 4.5 && normalizedValue < 5.5) return 'rgba(230, 63, 12, 0.85)';
      if (normalizedValue >= 5.5 && normalizedValue < 6.0) return 'rgba(230, 212, 12, 0.85)';
      if (normalizedValue >= 6.0 && normalizedValue <= 7.0) return 'rgba(85, 230, 12, 0.85)';
      if (normalizedValue > 7.0 && normalizedValue <= 7.5) return 'rgba(197, 230, 12, 0.85)';
      if (normalizedValue > 7.5 && normalizedValue <= 8.5) return 'rgba(12, 170, 230, 0.85)';
      return '#60a5fa';
    }

    // Farben für EC/TDS/Salinity (in mS/cm)
    if (unitLower.includes('ms/cm') || unitLower.includes('ms/us') || unitLower.includes('µs') || unitLower.includes('us') || unitLower.includes('salinity')) {
      if (normalizedValue < 0.1) return '#60a5fa';
      if (normalizedValue >= 0.1 && normalizedValue <= 0.5) return 'rgba(85, 230, 12, 0.85)';
      if (normalizedValue > 0.5 && normalizedValue <= 1.5) return 'rgba(197, 230, 12, 0.85)';
      if (normalizedValue > 1.5 && normalizedValue <= 2.5) return 'rgba(230, 212, 12, 0.85)';
      if (normalizedValue > 2.5) return 'rgba(230, 63, 12, 0.85)';
    }

    // Farben für PPM (TDS)
    if (unitLower.includes('ppm')) {
      if (normalizedValue < 50) return '#60a5fa';
      if (normalizedValue >= 50 && normalizedValue <= 250) return 'rgba(85, 230, 12, 0.85)';
      if (normalizedValue > 250 && normalizedValue <= 750) return 'rgba(197, 230, 12, 0.85)';
      if (normalizedValue > 750 && normalizedValue <= 1250) return 'rgba(230, 212, 12, 0.85)';
      if (normalizedValue > 1250) return 'rgba(230, 63, 12, 0.85)';
    }

    // Farben für Temperatur (Celsius)
    if (unitLower.includes('celsius') || unitLower.includes('°c')) {
      if (normalizedValue < 10) return '#60a5fa';
      if (normalizedValue >= 10 && normalizedValue <= 15) return 'rgba(12, 226, 230, 0.86)';
      if (normalizedValue > 15 && normalizedValue <= 20) return 'rgba(12, 230, 165, 0.85)';
      if (normalizedValue > 20 && normalizedValue <= 25) return 'rgba(230, 212, 12, 0.85)';
      if (normalizedValue > 25) return 'rgba(230, 63, 12, 0.85)';
    }

    return '#ffffff';
  };

  // Formatierung mit Einheitskonvertierung
  const getFormattedValueWithUnit = (value, unit) => {
    const unitLower = unit.toLowerCase();
    
    if (unitLower.includes('µs') || unitLower.includes('us') || unitLower.includes('ms/us')) {
      const mSValue = value / 1000;
      return {
        value: mSValue % 1 === 0 ? mSValue.toFixed(0) : mSValue.toFixed(2),
        unit: 'mS/cm'
      };
    }
    
    return {
      value: value % 1 === 0 ? value.toFixed(0) : value.toFixed(2),
      unit: unit
    };
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
        {waterSensors.map((sensor) => {
          const formatted = getFormattedValueWithUnit(sensor.value, sensor.unit);
          return (
            <DataBox key={sensor.id} onClick={() => handleDataBoxClick(sensor.id)}>
              <Label>{sensor.friendlyName}</Label>
              <ValueWrapper>
                <Value style={{ color: getColorForValue(sensor.value, sensor.unit) }}>
                  {formatted.value}
                </Value>
                <Unit>{formatted.unit}</Unit>
              </ValueWrapper>
            </DataBox>
          );
        })}
        {waterSensors.length === 0 && <NoData>No Water sensors found.</NoData>}
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