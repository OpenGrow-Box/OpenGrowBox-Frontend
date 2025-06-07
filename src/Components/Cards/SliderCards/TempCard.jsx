import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import HistoryChart from '../HistoryChart'; // Importiere die HistoryChart-Komponente

const TempCard = () => {
  const { entities } = useHomeAssistant();
  const [tempSensors, setTempSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null); // State für den ausgewählten Sensor

  // Formatierung des Labels
  const formatLabel = (label) => {
    return label
      .replace(/^OGB_AVGTemperature/, '') // Entferne "OGB_"
      .replace(/_/g, ' ') // Ersetze Unterstriche mit Leerzeichen
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Leerzeichen bei CamelCase
      .toLowerCase() // Kleinschreibung
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Großbuchstaben bei Wörtern
  };

  useEffect(() => {
    const updateTempCard = () => {
      const sensors = Object.entries(entities)
        .filter(
          ([key, entity]) =>
            key.startsWith('sensor.') &&
            (key.toLowerCase().includes('avgtemp')) &&
            !isNaN(parseFloat(entity.state))
        )
        .map(([key, entity]) => ({
          id: key,
          value: parseFloat(entity.state),
          unit: entity.attributes?.unit_of_measurement || 'ppm',
          friendlyName: formatLabel(entity.attributes?.friendly_name || key),
        }));

      setTempSensors(sensors);
    };

    updateTempCard();
  }, [entities]);

  // Funktion zur Bestimmung der Farbe basierend auf dem Temperatur-Wert
  const getColorForValue = (value) => {
    if (value < 10) return '#34d399'; // Grün für sehr niedrige Werte unter 10°C
    if (value >= 10 && value <= 18) return '#00aaff'; // Blau für Werte zwischen 10 und 18°C
    if (value > 18 && value <= 25) return '#fbbf24'; // Gelb
    if (value > 25 && value <= 35) return '#fb923c'; // Orange
    if (value > 35 && value <= 40) return '#ef4444'; // Rot
    return '#7f1d1d'; // Dunkelrot für sehr hohe Werte über 40°C
  };

  // Funktion zum Öffnen des Modals für einen Sensor
  const handleDataBoxClick = (sensorId) => {
    setSelectedSensor(sensorId);
  };

  // Funktion zum Schließen des Modals
  const closeHistoryChart = () => {
    setSelectedSensor(null);
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
            <CloseButton onClick={closeHistoryChart}>X</CloseButton>
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
