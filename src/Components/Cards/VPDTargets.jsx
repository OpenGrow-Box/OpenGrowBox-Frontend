import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { usePlantStages } from '../Context/PlantStageContext';
import { FaBullseye, FaArrowDown, FaArrowUp, FaPercentage, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

let updateTimeout = null;

const STAGE_NAME_MAP = {
  germination: 'Germination',
  clones: 'Clones',
  earlyveg: 'EarlyVeg',
  midveg: 'MidVeg',
  lateveg: 'LateVeg',
  earlyflower: 'EarlyFlower',
  midflower: 'MidFlower',
  lateflower: 'LateFlower',
};

// 🔹 Berechnung des perfekten VPD
const calculatePerfectVpd = (vpdRange, tolerancePercent) => {
  if (!Array.isArray(vpdRange) || vpdRange.length !== 2) {
    throw new Error('vpdRange must be an array with exactly two numbers.');
  }

  let vpdMin, vpdMax, tolerance;
  try {
    vpdMin = parseFloat(vpdRange[0]);
    vpdMax = parseFloat(vpdRange[1]);
    tolerance = parseFloat(tolerancePercent);
  } catch (err) {
    throw new Error('Invalid inputs for vpdRange or tolerancePercent.');
  }

  if (isNaN(vpdMin) || isNaN(vpdMax) || isNaN(tolerance)) {
    throw new Error('Invalid inputs: vpdRange or tolerancePercent must be valid numbers.');
  }

  const averageVpd = (vpdMin + vpdMax) / 2;
  const toleranceValue = (tolerance / 100) * averageVpd;

  return {
    perfection: Number(averageVpd.toFixed(3)),
    perfectMin: Number((averageVpd - toleranceValue).toFixed(3)),
    perfectMax: Number((averageVpd + toleranceValue).toFixed(3)),
  };
};

const VPDTargets = () => {
  const { entities, connection, connectionState, currentRoom } = useHomeAssistant();
  const { plantStages: remotePlantStages, getStageConfig, loading: stagesLoading, error: plantError, requestPlantStages } = usePlantStages();
  
  // All hooks at the top - no early returns before hooks
  const [plantStage, setPlantStage] = useState('EarlyVeg');
  const [tolerance, setTolerance] = useState(5);
  const [vpdTarget, setVpdTarget] = useState(null);
  const [tentMode, setTentMode] = useState('');

  // Request plant stages when connected
  useEffect(() => {
    if (connectionState === 'connected' && !remotePlantStages && !stagesLoading) {
      requestPlantStages(currentRoom);
    }
  }, [connectionState, currentRoom, remotePlantStages, stagesLoading, requestPlantStages]);

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

        if (selected.length > 0 && selected[0] !== plantStage) {
          setPlantStage(selected[0]);
        }
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

        if (tol.length > 0 && tol[0] !== tolerance) {
          setTolerance(tol[0]);
        }
      } catch (err) {
        console.error('Tolerance update error:', err);
      }
    };

    const updateVpdTarget = () => {
      try {
        const target = Object.entries(entities)
          .filter(([key, entity]) =>
            key.startsWith('number.ogb_vpdtarget_') &&
            key.toLowerCase().includes(currentRoom.toLowerCase())
          )
          .map(([_, entity]) => parseFloat(entity.state))
          .filter(v => !isNaN(v));

        if (target.length > 0 && target[0] !== vpdTarget) {
          setVpdTarget(target[0]);
        }
      } catch (err) {
        console.error('VPD target update error:', err);
      }
    };

    const updateTentMode = () => {
      try {
        const mode = Object.entries(entities)
          .filter(([key, entity]) =>
            key.startsWith('select.ogb_tentmode_') &&
            key.toLowerCase().includes(currentRoom.toLowerCase())
          )
          .map(([_, entity]) => entity.state);

        if (mode.length > 0 && mode[0] !== tentMode) {
          setTentMode(mode[0]);
        }
      } catch (err) {
        console.error('Tent mode update error:', err);
      }
    };

    updatePlantStage();
    updateTolerance();
    updateVpdTarget();
    updateTentMode();

    updateTimeout = setInterval(() => {
      updatePlantStage();
      updateTolerance();
      updateVpdTarget();
      updateTentMode();
    }, 5000);

    return () => {
      if (updateTimeout) clearInterval(updateTimeout);
    };
  }, [entities, currentRoom, plantStage, tolerance, vpdTarget, tentMode]);

  // Convert remote plant stages to display format
  const plantStages = useMemo(() => {
    if (!remotePlantStages) {
      return {
        LateVeg: { vpdRange: [0.9, 1.65], minTemp: 24, maxTemp: 27, minHumidity: 55, maxHumidity: 68 },
        EarlyVeg: { vpdRange: [0.6, 1.2], minTemp: 22, maxTemp: 26, minHumidity: 65, maxHumidity: 75 },
        MidVeg: { vpdRange: [0.75, 1.45], minTemp: 23, maxTemp: 27, minHumidity: 60, maxHumidity: 72 },
        EarlyFlower: { vpdRange: [0.8, 1.55], minTemp: 22, maxTemp: 26, minHumidity: 55, maxHumidity: 68 },
        MidFlower: { vpdRange: [0.9, 1.7], minTemp: 21, maxTemp: 25, minHumidity: 38, maxHumidity: 52 },
        LateFlower: { vpdRange: [0.9, 1.85], minTemp: 20, maxTemp: 26, minHumidity: 40, maxHumidity: 55 },
      };
    }
    const converted = {};
    Object.entries(remotePlantStages).forEach(([key, config]) => {
      let vpdRange;
      if (config.vpdRange && Array.isArray(config.vpdRange)) {
        vpdRange = config.vpdRange;
      } else if (config.minVPD !== undefined && config.maxVPD !== undefined) {
        vpdRange = [config.minVPD, config.maxVPD];
      }
      
      if (vpdRange && Array.isArray(vpdRange)) {
        converted[key] = {
          vpdRange: vpdRange.map(v => Number(v || 0)),
          minTemp: config.minTemp,
          maxTemp: config.maxTemp,
          minHumidity: config.minHumidity,
          maxHumidity: config.maxHumidity,
        };
      }
    });
    return converted;
  }, [remotePlantStages]);

  // Now it's safe to have conditional returns - all hooks are called above
  if (stagesLoading) {
    return (
      <Container>
        <LoadingWrapper>
          <FaSpinner className="spin" />
          <LoadingText>Loading plant stages...</LoadingText>
        </LoadingWrapper>
      </Container>
    );
  }

  // Calculate VPD results
  let vpdResults = { perfection: 0, perfectMin: 0, perfectMax: 0 };
  let errorMsg = '';
  try {
    const isVpdTargetMode = String(tentMode || '').toLowerCase().includes('target');

    if (isVpdTargetMode && typeof vpdTarget === 'number' && !isNaN(vpdTarget)) {
      vpdResults = calculatePerfectVpd([vpdTarget, vpdTarget], tolerance);
    } else {
      const selectedStage = plantStages[plantStage];
      if (!selectedStage) {
        return (
          <Container>
            <ErrorText>
              <FaExclamationTriangle /> Unknown stage: {plantStage}
            </ErrorText>
          </Container>
        );
      }
      vpdResults = calculatePerfectVpd(selectedStage.vpdRange, tolerance);
    }
  } catch (err) {
    console.error(err);
    errorMsg = err?.message || 'Unknown error';
  }

  // Render
  return (
    <Container>
      {errorMsg ? (
        <ErrorText>
          <FaExclamationTriangle /> {errorMsg}
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
            <FaArrowUp color="#fc7d7c" />{vpdResults.perfectMax} kPa
          </Result>
        </ResultsWrapper>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0.5rem;
  color: var(--main-text-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 25rem;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--second-text-color);
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.span`
  font-size: 0.9rem;
  color: var(--second-text-color);
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

export default VPDTargets;