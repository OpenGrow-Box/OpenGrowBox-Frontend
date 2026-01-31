import  { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { FaBullseye, FaArrowDown, FaArrowUp, FaPercentage } from 'react-icons/fa';

// 🔹 Pflanzenphasen & Zielwerte
const plantStages = {
  Germination: { vpdRange: [0.412, 0.70], minTemp: 20, maxTemp: 24, minHumidity: 65, maxHumidity: 80 },
  Clones: { vpdRange: [0.412, 0.65], minTemp: 20, maxTemp: 24, minHumidity: 65, maxHumidity: 80 },
  EarlyVeg: { vpdRange: [0.65, 0.80], minTemp: 20, maxTemp: 26, minHumidity: 55, maxHumidity: 70 },
  MidVeg: { vpdRange: [0.80, 1.0], minTemp: 20, maxTemp: 27, minHumidity: 55, maxHumidity: 65 },
  LateVeg: { vpdRange: [1.05, 1.1], minTemp: 20, maxTemp: 27, minHumidity: 55, maxHumidity: 65 },
  EarlyFlower: { vpdRange: [1.0, 1.25], minTemp: 22, maxTemp: 26, minHumidity: 50, maxHumidity: 65 },
  MidFlower: { vpdRange: [1.1, 1.35], minTemp: 22, maxTemp: 25, minHumidity: 45, maxHumidity: 60 },
  LateFlower: { vpdRange: [1.2, 1.65], minTemp: 20, maxTemp: 24, minHumidity: 40, maxHumidity: 55 },
};

// 🔹 Berechnung des perfekten VPD
const calculatePerfectVpd = (vpdRange, tolerancePercent) => {
  // Validate that vpdRange is an array or tuple-like with exactly two elements
  if (!Array.isArray(vpdRange) || vpdRange.length !== 2) {
    throw new Error('vpdRange must be an array with exactly two numbers.');
  }

  // Convert inputs to numbers and validate
  let vpdMin, vpdMax, tolerance;
  try {
    vpdMin = parseFloat(vpdRange[0]);
    vpdMax = parseFloat(vpdRange[1]);
    tolerance = parseFloat(tolerancePercent);
  } catch (err) {
    throw new Error('Invalid inputs for vpdRange or tolerancePercent.');
  }

  // Check for NaN or invalid numbers
  if (isNaN(vpdMin) || isNaN(vpdMax) || isNaN(tolerance)) {
    throw new Error('Invalid inputs: vpdRange or tolerancePercent must be valid numbers.');
  }

  // Calculate average VPD (perfection)
  const averageVpd = (vpdMin + vpdMax) / 2;
  const toleranceValue = (tolerance / 100) * averageVpd;

  // Return rounded results
  return {
    perfection: Number(averageVpd.toFixed(3)),
    perfectMin: Number((averageVpd - toleranceValue).toFixed(3)),
    perfectMax: Number((averageVpd + toleranceValue).toFixed(3)),
  };
};

const VPDTargets = () => {
  const { entities, connection, currentRoom } = useHomeAssistant();
  const [plantStage, setPlantStage] = useState('Germination');
  const [tolerance, setTolerance] = useState(5);
  const [error, setError] = useState('');

  // 🔹 Entity-Werte aus HomeAssistant holen
  useEffect(() => {
    if (!entities || !currentRoom) return;

    const updatePlantStage = () => {
      try {
        const selected = Object.entries(entities)
          .filter(([key, entity]) =>
            key.startsWith('select.ogb_plantstage_') &&
            key.toLowerCase().includes(currentRoom.toLowerCase())
          )
          .map(([_, entity]) => entity.state);

        if (selected.length > 0) setPlantStage(selected[0]);
      } catch (err) {
        console.error('Plant stage update error:', err);
      }
    };

    const updateTolerance = () => {
      try {
        const tol = Object.entries(entities)
          .filter(([key, entity]) =>
            key.startsWith('number.ogb_vpdtolerance_') &&
            key.toLowerCase().includes(currentRoom.toLowerCase())
          )
          .map(([_, entity]) => parseFloat(entity.state))
          .filter(v => !isNaN(v));

        if (tol.length > 0) setTolerance(tol[0]);
      } catch (err) {
        console.error('Tolerance update error:', err);
      }
    };

    updatePlantStage();
    updateTolerance();

    // 🔹 Live-Updates aus HA
    if (connection) {
      const listener = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state_changed') {
            const id = data.entity_id.toLowerCase();
            if (
              id.includes('ogb_plantstage_') ||
              id.includes('ogb_vpdtolerance_')
            ) {
              updatePlantStage();
              updateTolerance();
            }
          }
        } catch (e) {
          console.error('Websocket event parse error', e);
        }
      };
      connection.addEventListener('message', listener);
      return () => connection.removeEventListener('message', listener);
    }
  }, [entities, connection, currentRoom]);

  // 🔹 Berechnung
  let vpdResults = { perfection: 0, perfectMin: 0, perfectMax: 0 };
  try {
    const selectedStage = plantStages[plantStage];
    if (!selectedStage) throw new Error(`Unknown stage: ${plantStage}`);
    vpdResults = calculatePerfectVpd(selectedStage.vpdRange, tolerance);
  } catch (err) {
    console.error(err);
    setError(err.message);
  }

  // 🔹 Anzeige
  return (
    <Container>

      {error ? (
        <ErrorText>
          <FaExclamationTriangle /> {error}
        </ErrorText>
      ) : (
        <ResultsWrapper>
          <Result>
            <FaPercentage color="#d3d3d3" />{tolerance} %
          </Result>
          <Result>
            <FaArrowDown color="#7cd6fc" />{vpdResults.perfectMin} kPa
          </Result>
          <Result>
            <FaBullseye color="#9efc7c" />{vpdResults.perfection} kPa
          </Result>
          <Result>
            <FaArrowUp color="#fc7c7c" />{vpdResults.perfectMax} kPa
          </Result>
        </ResultsWrapper>
      )}
    </Container>
  );
};

export default VPDTargets;

// 🔹 Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin:0.5rem;

  color: var(--main-text-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 25rem;
`;



const ResultsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const Result = styled.div`
  font-size: 0.85rem;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 8px;


`;

const ErrorText = styled.div`
  color: #ff7272;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;