import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useMedium } from '../Context/MediumContext';
import {
  FaCheck, FaTimes, FaEdit, FaSeedling,
  FaChartBar, FaLeaf, FaClock, FaFlagCheckered, FaFlask
} from "react-icons/fa";

const GrowDayCounter = () => {
  const { connection, currentRoom, isConnectionValid } = useHomeAssistant();
  const { 
    currentMedium, 
    currentMediumIndex, 
    updateMediumPlantDates, 
    startEditing, 
    stopEditing,
    isFieldEditing,
    debouncedUpdate 
  } = useMedium();

  // States for editing
  const [isEditingPlant, setIsEditingPlant] = useState(false);
  const [breederNameInputValue, setBreederNameInputValue] = useState('');
  const [plantNameInputValue, setPlantNameInputValue] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  // Local state for inputs
  const [breederTarget, setBreederTarget] = useState('');
  const [growStartDate, setGrowStartDate] = useState('');
  const [bloomSwitchDate, setBloomSwitchDate] = useState('');
  
  // Refs for debounce timers
  const breederTimeoutRef = useRef(null);
  const growStartTimeoutRef = useRef(null);
  const bloomSwitchTimeoutRef = useRef(null);

  // Sync local state from currentMedium (only when not editing)
  useEffect(() => {
    if (currentMedium) {
      // Only update if not actively editing these fields
      if (!isFieldEditing('plant_name') && !isEditingPlant) {
        setPlantNameInputValue(currentMedium.plant_name || '');
      }
      if (!isFieldEditing('breeder_name') && !isEditingPlant) {
        setBreederNameInputValue(currentMedium.breeder_name || '');
      }
      if (!isFieldEditing('breeder_bloom_days')) {
        setBreederTarget(currentMedium.dates?.breederbloomdays?.toString() || '');
      }
      if (!isFieldEditing('grow_start')) {
        setGrowStartDate(currentMedium.dates?.growstartdate || '');
      }
      if (!isFieldEditing('bloom_switch')) {
        setBloomSwitchDate(currentMedium.dates?.bloomswitchdate || '');
      }
    }
  }, [currentMedium, isFieldEditing, isEditingPlant]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (breederTimeoutRef.current) clearTimeout(breederTimeoutRef.current);
      if (growStartTimeoutRef.current) clearTimeout(growStartTimeoutRef.current);
      if (bloomSwitchTimeoutRef.current) clearTimeout(bloomSwitchTimeoutRef.current);
    };
  }, []);

  // Format numbers
  const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value || '0';
    return Number.isInteger(num) ? num.toString() : num.toString();
  };

  // Progress calculation
  const getProgress = () => {
    if (!currentMedium?.dates) return 0;
    const total = parseFloat(currentMedium.dates.breederbloomdays);
    const current = parseFloat(currentMedium.dates.bloomdays);
    if (isNaN(total) || isNaN(current) || total <= 0) return 0;
    return Math.min((current / total) * 100, 100);
  };

  // Get growth phase
  const getGrowthPhase = () => {
    if (!currentMedium) return 'Unknown';
    return currentMedium.plant_stage || currentMedium.current_phase || 'Unknown';
  };

  // Update plant name and strain
  const handlePlantUpdate = async () => {
    if (!isConnectionValid() || currentMediumIndex === null) {
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus(''), 2000);
      return;
    }

    try {
      await updateMediumPlantDates(currentMediumIndex, {
        plant_name: plantNameInputValue.trim(),
        breeder_name: breederNameInputValue.trim(),
      });
      setIsEditingPlant(false);
      setUpdateStatus('success');
    } catch (error) {
      console.error('Error updating plant info:', error);
      setUpdateStatus('error');
    }

    setTimeout(() => setUpdateStatus(''), 2000);
  };

  // Handle breeder target update with debounce
  const handleBreederTargetChange = useCallback((value) => {
    setBreederTarget(value);
    startEditing('breeder_bloom_days');
    
    // Clear existing timeout
    if (breederTimeoutRef.current) {
      clearTimeout(breederTimeoutRef.current);
    }
    
    // Debounce the actual update
    breederTimeoutRef.current = setTimeout(async () => {
      if (!isConnectionValid() || currentMediumIndex === null) return;
      
      try {
        await updateMediumPlantDates(currentMediumIndex, {
          breeder_bloom_days: parseInt(value) || 0,
        });
      } catch (error) {
        console.error('Error updating breeder target:', error);
      }
    }, 800);
  }, [currentMediumIndex, isConnectionValid, updateMediumPlantDates, startEditing]);

  // Handle grow start date update with debounce
  const handleGrowStartChange = useCallback((value) => {
    setGrowStartDate(value);
    startEditing('grow_start');
    
    if (growStartTimeoutRef.current) {
      clearTimeout(growStartTimeoutRef.current);
    }
    
    growStartTimeoutRef.current = setTimeout(async () => {
      if (!isConnectionValid() || currentMediumIndex === null) return;
      
      try {
        await updateMediumPlantDates(currentMediumIndex, {
          grow_start: value,
        });
      } catch (error) {
        console.error('Error updating grow start date:', error);
      }
    }, 800);
  }, [currentMediumIndex, isConnectionValid, updateMediumPlantDates, startEditing]);

  // Handle bloom switch date update with debounce
  const handleBloomSwitchChange = useCallback((value) => {
    setBloomSwitchDate(value);
    startEditing('bloom_switch');
    
    if (bloomSwitchTimeoutRef.current) {
      clearTimeout(bloomSwitchTimeoutRef.current);
    }
    
    bloomSwitchTimeoutRef.current = setTimeout(async () => {
      if (!isConnectionValid() || currentMediumIndex === null) return;
      
      try {
        await updateMediumPlantDates(currentMediumIndex, {
          bloom_switch: value,
        });
      } catch (error) {
        console.error('Error updating bloom switch date:', error);
      }
    }, 800);
  }, [currentMediumIndex, isConnectionValid, updateMediumPlantDates, startEditing]);

  // Grow Finish Handler
  const handleGrowFinish = async () => {
    if (!isConnectionValid() || !currentMedium) {
      console.warn('No connection or medium available for grow finish');
      return;
    }

    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'finish_grow',
        service_data: {
          room: currentRoom,
          medium_index: currentMediumIndex,
          medium_name: currentMedium.medium_name,
          plant_name: currentMedium.plant_name,
          breeder_name: currentMedium.breeder_name,
          total_days: currentMedium.dates?.planttotaldays || 0,
          bloom_days: currentMedium.dates?.bloomdays || 0,
        }
      });

      console.log('Grow finish signal sent to backend');
    } catch (error) {
      console.error('Failed to send grow finish signal:', error);
    }
  };

  // Start editing plant info
  const startEditingPlant = () => {
    setPlantNameInputValue(currentMedium?.plant_name || '');
    setBreederNameInputValue(currentMedium?.breeder_name || '');
    setIsEditingPlant(true);
    startEditing('plant_name');
    startEditing('breeder_name');
  };

  // Cancel editing
  const cancelEditing = () => {
    setPlantNameInputValue(currentMedium?.plant_name || '');
    setBreederNameInputValue(currentMedium?.breeder_name || '');
    setIsEditingPlant(false);
    setUpdateStatus('');
    stopEditing('plant_name');
    stopEditing('breeder_name');
  };

  // Enter key handler
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePlantUpdate();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (!currentMedium) {
    return (
      <MotionContainer
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
      >
        <CounterCard>
          <NoDataMessage>
            <FaSeedling size={48} />
            <p>No medium selected</p>
            <small>Select a medium from the dropdown above</small>
          </NoDataMessage>
        </CounterCard>
      </MotionContainer>
    );
  }

  const progress = getProgress();
  const phase = getGrowthPhase();
  const dates = currentMedium.dates || {};

  return (
    <MotionContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <CounterCard>
        <CardHeader>
          <PlantTitleContainer>
            {isEditingPlant ? (
              <PlantEditContainer>
                <PlantInput
                  type="text"
                  value={plantNameInputValue}
                  onChange={(e) => setPlantNameInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Plant name..."
                  autoFocus
                />
                <BreederInput
                  type="text"
                  value={breederNameInputValue}
                  onChange={(e) => setBreederNameInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Breeder name..."
                />
                 <PlantEditButtons>
                   <PlantButton onClick={handlePlantUpdate} $success>
                     <FaCheck size={16} />
                   </PlantButton>
                   <PlantButton onClick={cancelEditing} $cancel>
                     <FaTimes size={16} />
                   </PlantButton>
                 </PlantEditButtons>
              </PlantEditContainer>
             ) : (
                <PlantTitleWrapper onClick={startEditingPlant}>
                  <PlantTitle>{currentMedium.plant_name || currentMedium.medium_name || 'Unknown Plant'}</PlantTitle>
                  <BreederSubtitle>{currentMedium.breeder_name || 'Unknown Breeder'}</BreederSubtitle>
                  <MediumBadge>
                    <FaFlask size={12} />
                    {currentMedium.medium_name || `Medium ${currentMediumIndex + 1}`}
                  </MediumBadge>
                  <EditIcon><FaEdit size={16} /></EditIcon>
                </PlantTitleWrapper>
             )}
            
             {updateStatus && (
               <UpdateStatus $success={updateStatus === 'success'}>
                 {updateStatus === 'success' ? (
                   <>
                     <FaCheck size={14} /> Saved
                   </>
                 ) : (
                   <>
                     <FaTimes size={14} /> Error
                   </>
                 )}
               </UpdateStatus>
             )}
          </PlantTitleContainer>
          
          <PhaseIndicator $phase={phase}>{phase}</PhaseIndicator>
           <CardTitle><FaSeedling size={20} /> Grow Day Counter - <Highlight>{currentRoom}</Highlight></CardTitle>
        </CardHeader>

        <ProgressSection>
          <ProgressLabel>Bloom Progress</ProgressLabel>
          <ProgressBarContainer>
            <ProgressBar $progress={progress} />
            <ProgressText>{progress.toFixed(1)}%</ProgressText>
          </ProgressBarContainer>
          <ProgressInfo>
            {formatNumber(dates.bloomdays)} / {formatNumber(dates.breederbloomdays)} days
          </ProgressInfo>
        </ProgressSection>

        <InputSection>
          <InputRow>
            <InputGroup>
              <InputLabel>Bloom Days Target</InputLabel>
              <StyledInput
                type="number"
                value={breederTarget}
                onChange={(e) => handleBreederTargetChange(e.target.value)}
                onFocus={() => startEditing('breeder_bloom_days')}
                onBlur={() => {
                  // Delay stop editing to allow debounced update to complete
                  setTimeout(() => stopEditing('breeder_bloom_days'), 1000);
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
                onChange={(e) => handleGrowStartChange(e.target.value)}
                onFocus={() => startEditing('grow_start')}
                onBlur={() => {
                  setTimeout(() => stopEditing('grow_start'), 1000);
                }}
              />
            </InputGroup>
            <InputGroup>
              <InputLabel>Bloom Switch</InputLabel>
              <StyledInput
                type="date"
                value={bloomSwitchDate}
                onChange={(e) => handleBloomSwitchChange(e.target.value)}
                onFocus={() => startEditing('bloom_switch')}
                onBlur={() => {
                  setTimeout(() => stopEditing('bloom_switch'), 1000);
                }}
              />
            </InputGroup>
          </InputRow>
        </InputSection>

        <StatsGrid>
           <StatCard>
             <StatIcon><FaChartBar size={24} /></StatIcon>
             <StatValue>{formatNumber(dates.planttotaldays)}</StatValue>
             <StatLabel>Total Days</StatLabel>
           </StatCard>
           <StatCard>
             <StatIcon><FaLeaf size={24} /></StatIcon>
             <StatValue>{formatNumber(dates.bloomdays)}</StatValue>
             <StatLabel>Bloom Days</StatLabel>
           </StatCard>
           <StatCard $highlight={parseFloat(dates.daysToChopChop) <= 7}>
             <StatIcon><FaClock size={24} /></StatIcon>
             <StatValue>{formatNumber(dates.daysToChopChop)}</StatValue>
             <StatLabel>Days Left</StatLabel>
           </StatCard>
          </StatsGrid>

          {/* Grow Finish Button */}
          <FinishSection>
            <FinishButton onClick={handleGrowFinish} disabled={!isConnectionValid()}>
              <FaFlagCheckered size={18} />
              <span>Finish Grow Cycle</span>
            </FinishButton>
            <FinishNote>
              This will complete the current grow cycle for this medium.
            </FinishNote>
          </FinishSection>
       </CounterCard>
     </MotionContainer>
   );
};

export default GrowDayCounter;

// Styled Components
const MotionContainer = motion(styled.div``);

const CounterCard = styled.div`
  background: linear-gradient(135deg,
    var(--main-bg-card-color)
  );
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem;
  max-width: 32rem;
  margin: 1rem auto;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    var(--glass-shadow-inset);
  color: var(--main-text-color);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  border: 1px solid var(--glass-border-light);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(74, 222, 128, 0.3) 20%,
      rgba(59, 130, 246, 0.3) 50%,
      rgba(147, 51, 234, 0.3) 80%,
      transparent 100%
    );
  }
`;

const NoDataMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--second-text-color);

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--main-text-color);
  }

  small {
    font-size: 0.875rem;
    opacity: 0.8;
  }
`;

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(74, 222, 128, 0.6) 30%,
      rgba(74, 222, 128, 0.8) 50%,
      rgba(74, 222, 128, 0.6) 70%,
      transparent 100%
    );
    border-radius: 1px;
  }
`;

const PlantTitleContainer = styled.div`
  margin-bottom: 1rem;
`;

const PlantTitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    background: linear-gradient(135deg,
      rgba(74, 222, 128, 0.08) 0%,
      rgba(34, 197, 94, 0.05) 100%
    );
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.15);
  }
`;

const PlantTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
  line-height: 1.1;

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const BreederSubtitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--second-text-color);
  opacity: 0.8;
`;

const MediumBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #22c55e;
  box-shadow: 0 2px 6px rgba(74, 222, 128, 0.2);

  svg {
    opacity: 0.8;
  }
`;

const EditIcon = styled.span`
  font-size: 1rem;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #4ade80;

  ${PlantTitleWrapper}:hover & {
    opacity: 1;
    transform: rotate(360deg) scale(1.1);
    color: #22c55e;
  }
`;

const PlantEditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
`;

const PlantInput = styled.input`
  font-size: 1.5rem;
  font-weight: 800;
  color: #4ade80;
  background: linear-gradient(135deg,
    var(--main-bg-Innercard-color) 0%,
    var(--main-bg-Innercard-color) 100%
  );
  backdrop-filter: blur(8px);
  border: 2px solid rgba(74, 222, 128, 0.4);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  text-align: center;
  width: 100%;
  max-width: 400px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(74, 222, 128, 0.15);

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow:
      0 0 0 3px rgba(74, 222, 128, 0.15),
      0 4px 16px rgba(74, 222, 128, 0.2);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: rgba(74, 222, 128, 0.6);
    font-weight: 600;
  }
`;

const BreederInput = styled(PlantInput)`
  font-size: 1.125rem;
  font-weight: 600;
`;

const PlantEditButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const PlantButton = styled.button`
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  ${props => props.$success && `
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
    }
  `}

  ${props => props.$cancel && `
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
    }
  `}

  &:active {
    transform: scale(0.95) translateY(0);
  }
`;

const UpdateStatus = styled.div`
  margin-top: 1rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 20px;
  background: ${props => props.$success
    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
  };
  color: ${props => props.$success ? '#16a34a' : '#dc2626'};
  border: 1px solid ${props => props.$success
    ? 'rgba(34, 197, 94, 0.3)'
    : 'rgba(239, 68, 68, 0.3)'
  };
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
`;

const PhaseIndicator = styled.div`
  display: inline-block;
  padding: 0.625rem 1.5rem;
  border-radius: 24px;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  background: rgba(74, 222, 128, 0.15);
  color: #16a34a;
  border: 1px solid rgba(74, 222, 128, 0.4);
  box-shadow: 0 2px 8px rgba(74, 222, 128, 0.15);
`;

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  opacity: 0.85;
  color: var(--second-text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  letter-spacing: 0.025em;
`;

const ProgressSection = styled.div`
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
`;

const ProgressLabel = styled.div`
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
  color: var(--main-text-color);
  letter-spacing: 0.025em;
  text-transform: uppercase;
  opacity: 0.9;
`;

const ProgressInfo = styled.div`
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.75;
  margin-top: 0.75rem;
  color: var(--second-text-color);
  background: var(--glass-bg-secondary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
`;

const ProgressBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 12px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--glass-border);
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(135deg,
    #4ade80 0%,
    #22c55e 50%,
    #16a34a 100%
  );
  border-radius: 8px;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.025em;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: var(--glass-bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
`;

const InputRow = styled.div`
  display: flex;
  gap: 1.25rem;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--main-text-color);
  letter-spacing: 0.025em;
  text-transform: uppercase;
  opacity: 0.85;
`;

const StyledInput = styled.input`
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  backdrop-filter: blur(8px);
  color: var(--main-text-color);
  border: 1px solid var(--glass-border-light);
  padding: 0.875rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    background: var(--main-bg-Innercard-color);
    box-shadow:
      0 0 0 3px rgba(59, 130, 246, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background: ${props => props.$highlight
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
  };
  backdrop-filter: blur(8px);
  border: 1px solid ${props => props.$highlight
    ? 'rgba(239, 68, 68, 0.3)'
    : 'rgba(255, 255, 255, 0.12)'
  };
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div`
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
  opacity: 0.8;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
`;

const StatLabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--second-text-color);
  opacity: 0.8;
  letter-spacing: 0.025em;
  text-transform: uppercase;
`;

const Highlight = styled.span`
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: 0.025em;
`;

const FinishSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.05) 0%,
    rgba(220, 38, 38, 0.08) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  text-align: center;
`;

const FinishButton = styled.button`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FinishNote = styled.p`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
`;
