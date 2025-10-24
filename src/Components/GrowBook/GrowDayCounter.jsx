import { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useHomeAssistant } from '../Context/HomeAssistantContext';

const GrowDayCounter = () => {
  const { entities, connection, currentRoom } = useHomeAssistant();

  // Zustände für die Sensoren
  const [breederTarget, setBreederTarget] = useState('');
  const [growStartDate, setGrowStartDate] = useState('');
  const [bloomSwitchDate, setBloomSwitchDate] = useState('');
  const [totalBloomDays, setTotalBloomDays] = useState('');
  const [plantTotalDays, setPlantTotalDays] = useState('');
  const [remainingDays, setRemainingDays] = useState('');
  const [strainName, setStrainName] = useState('');
  
  // Neue States für Strain-Name Bearbeitung
  const [isEditingStrain, setIsEditingStrain] = useState(false);
  const [strainInputValue, setStrainInputValue] = useState('');
  const [strainUpdateStatus, setStrainUpdateStatus] = useState('');

  // Memoized roomKey to prevent unnecessary recalculations
  const roomKey = useMemo(() => currentRoom.toLowerCase(), [currentRoom]);

  // Ref für vorherige Entity-Werte um Änderungen zu tracken
  const prevEntitiesRef = useRef({});

  // Memoized entity IDs für bessere Performance
  const entityIds = useMemo(() => ({
    breederTarget: `number.ogb_breederbloomdays_${roomKey}`,
    growStartDate: `date.ogb_growstartdate_${roomKey}`,
    bloomSwitchDate: `date.ogb_bloomswitchdate_${roomKey}`,
    totalBloomDays: `sensor.ogb_totalbloomdays_${roomKey}`,
    plantTotalDays: `sensor.ogb_planttotaldays_${roomKey}`,
    remainingDays: `sensor.ogb_chopchoptime_${roomKey}`,
    strainName: `text.ogb_strainname_${roomKey}`
  }), [roomKey]);

  // Memoized relevante Entities um nur bei Änderungen zu re-rendern
  const relevantEntities = useMemo(() => {
    const relevant = {};
    Object.entries(entityIds).forEach(([key, entityId]) => {
      if (entities[entityId]) {
        relevant[key] = entities[entityId].state;
      }
    });
    return relevant;
  }, [entities, entityIds]);

  // Hilfsfunktion: Formatiert Zahlen, sodass .0 entfernt wird
  const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return Number.isInteger(num) ? num.toString() : num.toString();
  };

  // Progress calculation
  const getProgress = () => {
    const total = parseFloat(breederTarget);
    const current = parseFloat(totalBloomDays);
    if (isNaN(total) || isNaN(current) || total <= 0) return 0;
    return Math.min((current / total) * 100, 100);
  };

  // Get growth phase
  const getGrowthPhase = () => {
    const bloomDays = parseFloat(totalBloomDays);
    const remaining = parseFloat(remainingDays);
    
    if (isNaN(bloomDays) || bloomDays === 0) return 'Vegetative';
    if (remaining > 0) return 'Flowering';
    return 'Ready to Harvest';
  };

  // Aktualisieren von Zahlensensoren (z. B. Breeder Bloom Days)
  const handleNumberUpdate = async (entityId, value) => {
    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'number',
          service: 'set_value',
          service_data: { entity_id: entityId, value },
        });
      } catch (error) {
        console.error('Error updating entity:', error);
      }
    }
  };

  // Aktualisieren von Datumssensoren
  const handleDateUpdate = async (entityId, value) => {
    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'opengrowbox',
          service: 'update_date',
          service_data: { entity_id: entityId, date: value },
        });
      } catch (error) {
        console.error('Error updating entity:', error);
      }
    }
  };

  // Strain-Name aktualisieren
  const handleStrainUpdate = async () => {
    if (connection && strainInputValue.trim()) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'opengrowbox',
          service: 'update_text',
          service_data: {
            entity_id: entityIds.strainName,
            text: strainInputValue.trim(),
          },
        });
        setStrainName(strainInputValue.trim());
        setIsEditingStrain(false);
        setStrainUpdateStatus('success');
      } catch (error) {
        console.error('Error updating strain name:', error);
        setStrainUpdateStatus('error');
      }
      
      // Status nach 2 Sekunden zurücksetzen
      setTimeout(() => setStrainUpdateStatus(''), 2000);
    }
  };

  // Strain-Name Bearbeitung starten
  const startEditingStrain = () => {
    setStrainInputValue(strainName || '');
    setIsEditingStrain(true);
  };

  // Strain-Name Bearbeitung abbrechen
  const cancelEditingStrain = () => {
    setStrainInputValue('');
    setIsEditingStrain(false);
    setStrainUpdateStatus('');
  };

  // Enter-Taste zum Speichern
  const handleStrainKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStrainUpdate();
    } else if (e.key === 'Escape') {
      cancelEditingStrain();
    }
  };

  // ✅ OPTIMIERTER useEffect - triggert nur bei tatsächlichen Änderungen der relevanten Entities
  useEffect(() => {
    // Vergleiche nur die tatsächlichen Werte und update nur wenn sich etwas geändert hat
    const prev = prevEntitiesRef.current;
    let hasChanges = false;

    if (relevantEntities.breederTarget !== prev.breederTarget) {
      setBreederTarget(relevantEntities.breederTarget || '');
      hasChanges = true;
    }
    if (relevantEntities.growStartDate !== prev.growStartDate) {
      setGrowStartDate(relevantEntities.growStartDate || '');
      hasChanges = true;
    }
    if (relevantEntities.bloomSwitchDate !== prev.bloomSwitchDate) {
      setBloomSwitchDate(relevantEntities.bloomSwitchDate || '');
      hasChanges = true;
    }
    if (relevantEntities.totalBloomDays !== prev.totalBloomDays) {
      setTotalBloomDays(relevantEntities.totalBloomDays || '');
      hasChanges = true;
    }
    if (relevantEntities.plantTotalDays !== prev.plantTotalDays) {
      setPlantTotalDays(relevantEntities.plantTotalDays || '');
      hasChanges = true;
    }
    if (relevantEntities.remainingDays !== prev.remainingDays) {
      setRemainingDays(relevantEntities.remainingDays || '');
      hasChanges = true;
    }
    if (relevantEntities.strainName !== prev.strainName) {
      setStrainName(relevantEntities.strainName || '');
      hasChanges = true;
    }

    // Speichere aktuelle Werte für nächsten Vergleich
    prevEntitiesRef.current = { ...relevantEntities };
  }, [currentRoom]); // Dependency auf memoized relevantEntities

  const progress = getProgress();
  const phase = getGrowthPhase();

  return (
    <MotionContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <CounterCard>
        <CardHeader>
          <StrainTitleContainer>
            {isEditingStrain ? (
              <StrainEditContainer>
                <StrainInput
                  type="text"
                  value={strainInputValue}
                  onChange={(e) => setStrainInputValue(e.target.value)}
                  onKeyDown={handleStrainKeyPress}
                  placeholder="Strain name eingeben..."
                  autoFocus
                />
                <StrainEditButtons>
                  <StrainButton onClick={handleStrainUpdate} success>
                    ✓
                  </StrainButton>
                  <StrainButton onClick={cancelEditingStrain} cancel>
                    ✕
                  </StrainButton>
                </StrainEditButtons>
              </StrainEditContainer>
            ) : (
              <StrainTitleWrapper onClick={startEditingStrain}>
                <StrainTitle>{strainName || 'Unknown Strain'}</StrainTitle>
                <EditIcon>✏️</EditIcon>
              </StrainTitleWrapper>
            )}
            
            {strainUpdateStatus && (
              <StrainStatus success={strainUpdateStatus === 'success'}>
                {strainUpdateStatus === 'success' ? '✓ Gespeichert' : '✗ Fehler'}
              </StrainStatus>
            )}
          </StrainTitleContainer>
          
          <PhaseIndicator phase={phase}>{phase}</PhaseIndicator>
          <CardTitle>🌱 Grow Day Counter - <Highlight>{currentRoom}</Highlight></CardTitle>
        </CardHeader>

        <ProgressSection>
          <ProgressLabel>Bloom Progress</ProgressLabel>
          <ProgressBarContainer>
            <ProgressBar progress={progress} />
            <ProgressText>{progress.toFixed(1)}%</ProgressText>
          </ProgressBarContainer>
          <ProgressInfo>
            {formatNumber(totalBloomDays)} / {formatNumber(breederTarget)} days
          </ProgressInfo>
        </ProgressSection>

        <InputSection>
          <InputRow>
            <InputGroup>
              <InputLabel>Bloom Days Target</InputLabel>
              <StyledInput
                type="number"
                value={formatNumber(breederTarget)}
                onChange={(e) => {
                  const value = e.target.value;
                  setBreederTarget(value);
                  handleNumberUpdate(entityIds.breederTarget, value);
                }}
              />
            </InputGroup>
          </InputRow>
          
          <InputRow>
            <InputGroup>
              <InputLabel>Grow Start</InputLabel>
              <StyledInput
                type="date"
                value={growStartDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setGrowStartDate(value);
                  handleDateUpdate(entityIds.growStartDate, value);
                }}
              />
            </InputGroup>
            <InputGroup>
              <InputLabel>Bloom Switch</InputLabel>
              <StyledInput
                type="date"
                value={bloomSwitchDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setBloomSwitchDate(value);
                  handleDateUpdate(entityIds.bloomSwitchDate, value);
                }}
              />
            </InputGroup>
          </InputRow>
        </InputSection>

        <StatsGrid>
          <StatCard>
            <StatIcon>📊</StatIcon>
            <StatValue>{formatNumber(plantTotalDays)}</StatValue>
            <StatLabel>Total Days</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>🌸</StatIcon>
            <StatValue>{formatNumber(totalBloomDays)}</StatValue>
            <StatLabel>Bloom Days</StatLabel>
          </StatCard>
          <StatCard highlight={parseFloat(remainingDays) <= 7}>
            <StatIcon>⏰</StatIcon>
            <StatValue>{formatNumber(remainingDays)}</StatValue>
            <StatLabel>Days Left</StatLabel>
          </StatCard>
        </StatsGrid>
      </CounterCard>
    </MotionContainer>
  );
};

export default GrowDayCounter;

// Styled Components bleiben unverändert...
const MotionContainer = motion(styled.div``);

const CounterCard = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 20px;
  padding: 1.5rem;
  max-width: 28rem;
  margin: 0.5rem auto;
  box-shadow: var(--main-shadow-art);
  color: var(--main-text-color);
  font-family: 'Arial', sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(74, 222, 128, 0.3);
`;

const StrainTitleContainer = styled.div`
  margin-bottom: 1rem;
`;

const StrainTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const StrainTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: #4ade80;
  text-shadow: 0 2px 4px rgba(74, 222, 128, 0.3);
`;

const EditIcon = styled.span`
  font-size: 1rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  
  ${StrainTitleWrapper}:hover & {
    opacity: 1;
  }
`;

const StrainEditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
`;

const StrainInput = styled.input`
  font-size: 1.8rem;
  font-weight: 700;
  color: #4ade80;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.5);
  border-radius: 8px;
  padding: 0.5rem;
  text-align: center;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(74, 222, 128, 0.5);
  }
`;

const StrainEditButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StrainButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.2s ease;
  
  ${props => props.success && `
    background: rgba(34, 197, 94, 0.8);
    color: white;
    &:hover {
      background: rgba(34, 197, 94, 1);
      transform: scale(1.1);
    }
  `}
  
  ${props => props.cancel && `
    background: rgba(239, 68, 68, 0.8);
    color: white;
    &:hover {
      background: rgba(239, 68, 68, 1);
      transform: scale(1.1);
    }
  `}
`;

const StrainStatus = styled.div`
  margin-top: 0.5rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 12px;
  background: ${props => props.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.success ? '#22c55e' : '#ef4444'};
  border: 1px solid ${props => props.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
`;

const PhaseIndicator = styled.div`
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  background: ${props => {
    switch(props.phase) {
      case 'Vegetative': return 'rgba(34, 197, 94, 0.2)';
      case 'Flowering': return 'rgba(251, 191, 36, 0.2)';
      case 'Ready to Harvest': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.phase) {
      case 'Vegetative': return '#22c55e';
      case 'Flowering': return '#fbbf24';
      case 'Ready to Harvest': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
  border: 1px solid ${props => {
    switch(props.phase) {
      case 'Vegetative': return 'rgba(34, 197, 94, 0.3)';
      case 'Flowering': return 'rgba(251, 191, 36, 0.3)';
      case 'Ready to Harvest': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(156, 163, 175, 0.3)';
    }
  }};
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
`;

const ProgressSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ProgressLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
  opacity: 0.8;
`;

const ProgressBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  color: #4ade80;
`;

const ProgressInfo = styled.div`
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.25rem;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InputRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const InputLabel = styled.label`
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  font-weight: 600;
  opacity: 0.9;
`;


const StyledInput = styled.input`
  background: rgba(30, 41, 59, 0.8);
  color: #f1f5f9;
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.875rem;
  width: 100%;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #38bdf8;
    background: rgba(30, 41, 59, 1);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
  }

  /* Browser Datepicker Icon – weiß machen */
  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 1;
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const StatCard = styled.div`
  background: ${props => props.highlight 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.highlight 
    ? 'rgba(239, 68, 68, 0.3)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  color: #4ade80;
  margin-bottom: 0.2rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  opacity: 0.7;
  font-weight: 500;
`;

const Highlight = styled.span`
  color: var(--second-text-color);
  font-weight: bold;
`;