import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { usePremium } from '../Context/OGBPremiumContext';

function generateRandomPlanName() {
  const firstParts = [
    'Bud', 'Green', 'Loud', 'Sticky', 'Dank', 'Cloud', 'Tricho', 'Resin', 'Herb',
    'Terp', 'Nug', 'Leaf', 'Smoke', 'Grow', 'Kief', '420', 'Chronic', 'THC', 'CBD'
  ];

  const secondParts = [
    'Labs', 'Force', 'Blaze', 'Fuel', 'Squad', 'Works', 'Power', 'Source',
    'Tech', 'Storm', 'Nation', 'Forge', 'Boost', 'Zone', 'Core', 'Kingz', 'Mode', 'Sense'
  ];

  const combos = [
    'Master', 'Ultra', 'Meta', 'Prime', 'NextGen', 'OG', 'Pro', 'Max', 'X'
  ];

  const part1 = firstParts[Math.floor(Math.random() * firstParts.length)];
  const part2 = secondParts[Math.floor(Math.random() * secondParts.length)];

  const useCombo = Math.random() < 0.3;
  const combo = useCombo ? ' ' + combos[Math.floor(Math.random() * combos.length)] : '';

  return `${part1}${part2}${combo}`;
}


// --- DATA STRUCTURE ---
const defaultWeek = (weekNumber, previousWeek = null) => ({
  week: weekNumber,
  lightStart: previousWeek?.lightStart || '06:00',
  lightEnd: previousWeek?.lightEnd || '18:00',
  lightIntensity: previousWeek?.lightIntensity || 100,
  lightDimmTime: previousWeek?.lightDimmTime || 45,
  isDimmable: previousWeek?.isDimmable || false,
  sunPhases: previousWeek?.sunPhases || false,
  vpd: previousWeek?.vpd || 1.0,
  nightVPDHold: previousWeek?.nightVPDHold || false,
  humidity: previousWeek?.humidity || 55,
  temperature: previousWeek?.temperature || 23,
  co2: previousWeek?.co2 || 400,
  co2Control: previousWeek?.co2Control || false,
  feedControl: previousWeek?.feedControl || false,
  EC: previousWeek?.EC || 1.2,
  PH: previousWeek?.PH || 6.0,
  A: previousWeek?.A || 5,
  B: previousWeek?.B || 3,
  C: previousWeek?.C || 4,
});

// --- COMPONENT ---
const GrowPlaner = () => {
  const [start_date, setStartDate] = useState('');
  const [weeks, setWeeks] = useState([defaultWeek(1)]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false); // Moved to plan level
  const { entities, currentRoom } = useHomeAssistant();
  const [strainName, setStrainName] = useState(generateRandomPlanName());
  const [growPlanName, addGrowPlanName] = useState(`${strainName} Plan`);
  const [isOpen, setIsOpen] = useState(false);
  const { getGrowPlan, addGrowPlan, delGrowPlan } = usePremium();
  const roomKey = useMemo(() => currentRoom.toLowerCase(), [currentRoom]);

  useEffect(() => {
    const strainSensor = entities[`text.ogb_strainname_${roomKey}`];
    if (strainSensor) {
      setStrainName(strainSensor.state);
    }
  }, [entities, roomKey]);

  const title = useMemo(() => `${strainName || 'Unnamed'} - Grow Planer`, [strainName]);
  const currentWeek = useMemo(() => weeks[selectedWeekIndex], [weeks, selectedWeekIndex]);

  const addWeek = useCallback(() => {
    setWeeks((prev) => {
      const lastWeek = prev[prev.length - 1];
      const newWeek = defaultWeek(prev.length + 1, lastWeek);
      return [...prev, newWeek];
    });
    setSelectedWeekIndex(weeks.length);
  }, [weeks.length]);

  const removeWeek = useCallback(() => {
    if (weeks.length > 1) {
      setWeeks((prev) => prev.slice(0, -1));
      setSelectedWeekIndex((prev) => Math.max(0, prev - 1));
    }
  }, [weeks.length]);

  const updateWeek = useCallback((field, value) => {
    setWeeks((prev) => {
      const updated = [...prev];
      updated[selectedWeekIndex][field] = value;
      return updated;
    });
  }, [selectedWeekIndex]);

  const toggleSwitch = useCallback((field) => {
    setWeeks((prev) => {
      const updated = [...prev];
      updated[selectedWeekIndex][field] = !updated[selectedWeekIndex][field];
      return updated;
    });
  }, [selectedWeekIndex]);

  const copyToClipboard = useCallback(() => {
    const jsonString = JSON.stringify({ strainName, growPlanName, roomKey, start_date, weeks, isPublic }, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert('JSON copied to clipboard!');
  }, [start_date, growPlanName, strainName, weeks, roomKey, isPublic]);

  const handleApplyGrowPlan = useCallback(() => {
    const jsonString = JSON.stringify({ strainName, growPlanName, roomKey, start_date, weeks, isPublic }, null, 2);
    addGrowPlan(jsonString);
  }, [start_date, growPlanName, weeks, strainName, roomKey, addGrowPlan, isPublic]);

  return (
    <>
      <Container $isOpen={isOpen}>
        <Header onClick={() => setIsOpen((prev) => !prev)}>
          <TitleSection>
            <Title>{title}</Title>
            <Subtitle> {weeks.length > 1 ? <>Weeks:{weeks.length} </> : <>Plan Your Grow</>} </Subtitle>
          </TitleSection>

          <ToggleIcon $isOpen={isOpen}>
            <ChevronIcon />
          </ToggleIcon>
        </Header>

        {isOpen && (
          <>
            <ControlsSection>
              {/* Action buttons at top on mobile, integrated on desktop */}
              <ActionButtonsWrapper>
                <StyledButton onClick={addWeek} variant="success">
                  ➕ Add Week
                </StyledButton>
                <StyledButton onClick={removeWeek} variant="danger" disabled={weeks.length <= 1}>
                  ➖ Remove Week
                </StyledButton>
                <StyledButton onClick={() => setIsModalOpen(true)}>
                  📋 Show JSON
                </StyledButton>
                <ApplyButton onClick={() => handleApplyGrowPlan(true)}>
                  ✨ Apply Grow Plan
                </ApplyButton>
              </ActionButtonsWrapper>

              <CompactSection>
                <CardHeader>
                  <CardTitle>📢 Publish Plan</CardTitle>
                  <ModernToggle
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    label="Make Plan Public available for Others and this Strain"
                  />
                </CardHeader>
              </CompactSection>

              {/* Input controls */}
              <InputsWrapper>
                <InputGroup>
                  <Label>🗓 Start Date</Label>
                  <StyledInput
                    type="date"
                    value={start_date}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </InputGroup>
                <InputGroup>
                  <Label>🌿 Grow Plan Name</Label>
                  <StyledInput
                    type="text"
                    value={growPlanName}
                    onChange={(e) => addGrowPlanName(e.target.value)}
                  />
                </InputGroup>
              </InputsWrapper>
            </ControlsSection>

            <WeekTabs>
              {weeks.map((week, i) => (
                <WeekButton
                  key={i}
                  active={i === selectedWeekIndex}
                  onClick={() => setSelectedWeekIndex(i)}
                  aria-label={`Select Week ${i + 1}`}
                >
                  <WeekBadge>{i + 1}</WeekBadge> 
                  <WeekText>Week</WeekText>
                </WeekButton>
              ))}
            </WeekTabs>

            <ParameterGrid>
              {/* Light Section */}
              <CompactSection>
                <CardHeader>
                  <CardTitle>💡 Light Schedule</CardTitle>
                  <ModernToggle
                    checked={currentWeek.isDimmable}
                    onChange={() => toggleSwitch('isDimmable')}
                    label="Dimmable"
                  />
                  <ModernToggle
                    checked={currentWeek.sunPhases}
                    onChange={() => toggleSwitch("sunPhases")}
                    label="sunPhases"
                  />
                </CardHeader>
                <ParameterRow>
                  <ParameterGroup>
                    <ParameterLabel>Start</ParameterLabel>
                    <CompactInput
                      type="time"
                      value={currentWeek.lightStart}
                      onChange={(e) => updateWeek('lightStart', e.target.value)}
                    />
                  </ParameterGroup>
                  <ParameterGroup>
                    <ParameterLabel>End</ParameterLabel>
                    <CompactInput
                      type="time"
                      value={currentWeek.lightEnd}
                      onChange={(e) => updateWeek('lightEnd', e.target.value)}
                    />
                  </ParameterGroup>
                  <ParameterGroup>
                    <ParameterLabel>Intensity</ParameterLabel>
                    <InputWithSuffix>
                      <CompactInput
                        type="number"
                        value={currentWeek.lightIntensity}
                        onChange={(e) => updateWeek('lightIntensity', e.target.value)}
                      />
                      <InputSuffix>%</InputSuffix>
                    </InputWithSuffix>
                  </ParameterGroup>
                  <ParameterGroup>
                    <ParameterLabel>SunPhase Time</ParameterLabel>
                    <InputWithSuffix>
                      <CompactInput
                        type="number"
                        value={currentWeek.lightDimmTime}
                        onChange={(e) => updateWeek('lightDimmTime', e.target.value)}
                      />
                      <InputSuffix>Minutes</InputSuffix>
                    </InputWithSuffix>
                  </ParameterGroup>

                </ParameterRow>
              </CompactSection>

              {/* Climate Section */}
              <CompactSection>
                <CardHeader>
                  <CardTitle>🌡️ Climate Control</CardTitle>
                  <ToggleGroup>
                    <ModernToggle
                      checked={currentWeek.nightVPDHold}
                      onChange={() => toggleSwitch('nightVPDHold')}
                      label="Night VPD"
                    />
                    <ModernToggle
                      checked={currentWeek.co2Control}
                      onChange={() => toggleSwitch('co2Control')}
                      label="CO₂ Control"
                    />
                  </ToggleGroup>
                </CardHeader>
                <ParameterRow>
                  <ParameterGroup>
                    <ParameterLabel>VPD</ParameterLabel>
                    <InputWithSuffix>
                      <CompactInput
                        type="number"
                        step="0.1"
                        value={currentWeek.vpd}
                        onChange={(e) => updateWeek('vpd', e.target.value)}
                      />
                      <InputSuffix>kPa</InputSuffix>
                    </InputWithSuffix>
                  </ParameterGroup>
                  <ParameterGroup>
                    <ParameterLabel>Temp</ParameterLabel>
                    <InputWithSuffix>
                      <CompactInput
                        type="number"
                        value={currentWeek.temperature}
                        onChange={(e) => updateWeek('temperature', e.target.value)}
                      />
                      <InputSuffix>°C</InputSuffix>
                    </InputWithSuffix>
                  </ParameterGroup>
                  <ParameterGroup>
                    <ParameterLabel>Humidity</ParameterLabel>
                    <InputWithSuffix>
                      <CompactInput
                        type="number"
                        value={currentWeek.humidity}
                        onChange={(e) => updateWeek('humidity', e.target.value)}
                      />
                      <InputSuffix>%</InputSuffix>
                    </InputWithSuffix>
                  </ParameterGroup>
                  <ParameterGroup>
                    <ParameterLabel>CO₂</ParameterLabel>
                    <InputWithSuffix>
                      <CompactInput
                        type="number"
                        value={currentWeek.co2}
                        onChange={(e) => updateWeek('co2', e.target.value)}
                      />
                      <InputSuffix>ppm</InputSuffix>
                    </InputWithSuffix>
                  </ParameterGroup>
                </ParameterRow>
              </CompactSection>
            </ParameterGrid>
              <CompactFoodSection>
                <CardHeader>
                  <CardTitle>🌱 Feed Control </CardTitle>
                  <ToggleGroup>
                      <ModernToggle
                        checked={currentWeek.feedControl}
                        onChange={() => toggleSwitch('feedControl')}
                        label="Feed Control"
                      />
                    </ToggleGroup>
                </CardHeader>

                  <FoodGrid>
                    <FoodLabel>
                      EC:
                      <FoodInput
                        type="number"
                        step="0.1"
                        value={currentWeek.EC}
                        onChange={(e) => updateWeek('EC', e.target.value)}
                      />
                    </FoodLabel>
                    <FoodLabel>
                      PH:
                      <FoodInput
                        type="number"
                        step="0.1"
                        value={currentWeek.PH}
                        onChange={(e) => updateWeek('PH', e.target.value)}
                      />
                    </FoodLabel>
                    <FoodLabel>
                      A:
                      <FoodInput
                        type="number"
                        value={currentWeek.A}
                        onChange={(e) => updateWeek('A', e.target.value)}
                      />
                      <Unit>ml</Unit>
                    </FoodLabel>
                    <FoodLabel>
                      B:
                      <FoodInput
                        type="number"
                        step="0.1"
                        value={currentWeek.B}
                        onChange={(e) => updateWeek('B', e.target.value)}
                      />
                      <Unit>ml</Unit>
                    </FoodLabel>
                    <FoodLabel>
                      C:
                      <FoodInput
                        type="number"
                        step="0.1"
                        value={currentWeek.C}
                        onChange={(e) => updateWeek('C', e.target.value)}
                      />
                      <Unit>ml</Unit>
                    </FoodLabel>
                  </FoodGrid>
              </CompactFoodSection>


            <ModalOverlay isOpen={isModalOpen}>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>📋 Output JSON</ModalTitle>
                  <CloseButton onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                    ✕
                  </CloseButton>
                </ModalHeader>
                <JsonOutput>{JSON.stringify({ strainName, growPlanName, roomKey, start_date, weeks, isPublic }, null, 2)}</JsonOutput>
                <CopyButton onClick={copyToClipboard}>📋 Copy to Clipboard</CopyButton>
              </ModalContent>
            </ModalOverlay>
          </>
        )}
      </Container>
    </>
  );
};

export default GrowPlaner;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  margin: 0 auto;
  padding: 1rem;
  border: 1px solid var(--secondary-accent);
  border-radius: 1rem;
  background: var(--main-bg-card-color);
  color: var(--main-text-color);
  box-shadow: var(--main-shadow-art);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #f1f5f9;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (min-width: 768px) {
    padding: 2rem;
    border-radius: 24px;
    width: 70%;
    max-width: 1200px;
  }
  
  @media (min-width: 1024px) {
    width: 90%;
    max-width: 900px;;
  }
  
  ${({ $isOpen }) => `
    max-height: ${$isOpen ? 'none' : '6rem'};
    overflow: ${$isOpen ? 'visible' : 'hidden'};
  `}
  
  @media (min-width: 768px) {
    ${({ $isOpen }) => `
      max-height: ${$isOpen ? '92vh' : '7rem'};
    `}
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(56, 189, 248, 0.2);
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-bottom-color: rgba(56, 189, 248, 0.4);
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ToggleIcon = styled.span`
  font-size: 1.25rem;
  transition: transform 0.3s ease;
  
  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
  
  ${({ $isOpen }) => $isOpen && `
    transform: rotate(180deg);
  `}
`;

const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
);

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    gap: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

const ActionButtonsWrapper = styled.div`
  display: flex;
  align-items:center;
  gap:1rem;
  justify-content:space-between;


  @media (min-width: 480px) {
    flex-direction: row;
    justify-content: center;
  }
  
  @media (min-width: 768px) {
    justify-content: flex-start;
    flex-direction: row;
  }
  @media (min-width: 1024px) {
    gap:0.5rem;
    font-size: 0.875rem;
  }

  `;

const InputsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (min-width: 480px) {
    flex-direction: row;
    gap: 1rem;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
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
  
  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const StyledButton = styled.button`
  background: linear-gradient(135deg, #1e293b, #334155);
  color: #f1f5f9;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.55rem 0.85rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  flex: 1;
  
  @media (min-width: 480px) {
    font-size: 0.875rem;
    padding: 0.35rem 0.45rem;
  }

  @media (min-width: 480px) {
    font-size: 0.675rem;
    padding: 0.35rem 0.45rem;
  }

  @media (min-width: 1024px) {
    font-size: 0.875rem;

    padding: 0.55rem 0.85rem;
  }


  &:hover {
    background: linear-gradient(135deg, #334155, #475569);
    border-color: rgba(56, 189, 248, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(56, 189, 248, 0.2);
  }

  ${props => props.variant === 'success' && `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    &:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); 
    }
  `}
  
  ${props => props.variant === 'danger' && `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    &:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); 
    }
    &:disabled { 
      opacity: 0.5; 
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  `}

`;

const ApplyButton = styled(StyledButton)`
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-color: rgba(168, 85, 247, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #8b5cf6, #c084fc);
    border-color: rgba(168, 85, 247, 0.6);
    box-shadow: 0 8px 20px rgba(168, 85, 247, 0.3);
  }
`;

const WeekTabs = styled.nav`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  justify-content: center;
  
  @media (min-width: 768px) {
    gap: 0.55rem;
    margin-bottom: 0.8rem;
    justify-content: flex-start;
  }
`;

const WeekButton = styled.button`
  background: ${({ active }) => 
    active 
      ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)' 
      : 'linear-gradient(135deg, #1e293b, #334155)'
  };
  border: 1px solid ${({ active }) => 
    active 
      ? 'rgba(56, 189, 248, 0.5)' 
      : 'rgba(56, 189, 248, 0.2)'
  };
  color: #f1f5f9;
  padding: 0.3rem 0.55rem;
  border-radius: 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.65rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    gap: 0.5rem;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(56, 189, 248, 0.2);
    border-color: rgba(56, 189, 248, 0.5);
  }
`;

const WeekBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  width: 0.55rem;
  height: 0.75rem;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.65rem;
  
  @media (min-width: 768px) {
    width: 0.55rem;
    height: 0.75rem;
    font-size: 0.75rem;
  }
`;

const WeekText = styled.span`
  display: none;
  
  @media (min-width: 480px) {
    display: inline;
  }
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
  }
`;

const CompactSection = styled.section`
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-left: 4px solid #38bdf8;
  padding: 0.5rem;
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  @media (min-width: 768px) {
    padding: 0.5rem;
    border-radius: 16px;
  }
  
  &:hover {
    border-color: rgba(56, 189, 248, 0.3);
    box-shadow: 0 8px 20px rgba(56, 189, 248, 0.1);
  }
`;

const CompactFoodSection = styled.section`
  display:flex;

  flex-direction:column;
  
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-left: 4px solid #38bdf8;

  width:100%;
  padding: 0.5rem;
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  @media (min-width: 768px) {
    border-radius: 16px;
  }
  
  &:hover {
    border-color: rgba(56, 189, 248, 0.3);
    box-shadow: 0 8px 20px rgba(56, 189, 248, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #fbbf24;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  @media (min-width: 480px) {
    flex-direction: row;
    gap: 1rem;
  }
`;

const ModernToggle = styled(({ checked, onChange, label, ...props }) => (
  <ToggleContainer {...props}>
    <ToggleSwitch checked={checked} onClick={onChange} />
    <ToggleLabel>{label}</ToggleLabel>
  </ToggleContainer>
))``;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleSwitch = styled.div`
  width: 44px;
  height: 24px;
  background: ${props => props.checked ? 
    'linear-gradient(135deg, #10b981, #059669)' : 
    'linear-gradient(135deg, #374151, #4b5563)'
  };
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: ${props => props.checked ? '23px' : '3px'};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
`;

const ParameterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const ParameterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ParameterLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CompactInput = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 10px;
  font-size: 0.875rem;
  background: rgba(30, 41, 59, 0.8);
  color: #f1f5f9;
  transition: all 0.3s ease;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #38bdf8;
    background: rgba(30, 41, 59, 1);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
  }
`;

const InputWithSuffix = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputSuffix = styled.span`
  position: absolute;
  right: 0.75rem;
  font-size: 0.75rem;
  color: #94a3b8;
  pointer-events: none;
`;

const FoodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
`;

const FoodLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
`;

const FoodInput = styled(CompactInput)`
  text-align: center;
  padding: 0.5rem;
`;

const Unit = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  visibility: ${({ isOpen }) => (isOpen ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, #0f172a, #1e293b);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 20px;
  padding: 2rem;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
`;

const CloseButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    transform: scale(1.1);
  }
`;

const JsonOutput = styled.pre`
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.6;
  border: 1px solid rgba(56, 189, 248, 0.2);
  margin-bottom: 1.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const CopyButton = styled(StyledButton)`
  background: linear-gradient(135deg, #059669, #047857);
  border-color: rgba(5, 150, 105, 0.3);
  width: 100%;
  
  &:hover {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: rgba(5, 150, 105, 0.6);
    box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
  }
`;