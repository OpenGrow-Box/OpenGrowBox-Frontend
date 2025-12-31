import React from 'react';
import styled from 'styled-components';
import { Droplets, HelpCircle } from 'lucide-react';
import { useTooltip } from './TooltipContext';

const FeedingManager = ({
  currentWeek,
  onUpdateWeek,
  onToggleSwitch
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const handleEcChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0.5, Math.min(3.0, numValue));
    onUpdateWeek('EC', clampedValue);
  };

  const handlePhChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(4.0, Math.min(8.0, numValue));
    onUpdateWeek('PH', clampedValue);
  };

  const handleNutrientChange = (nutrient, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(50, numValue)); // Max 50ml per plant
    onUpdateWeek(nutrient, clampedValue);
  };

  const getPhStatus = (ph) => {
    if (ph < 5.5) return { status: 'Too Acidic', color: '#ef4444' };
    if (ph > 6.5) return { status: 'Too Alkaline', color: '#f59e0b' };
    return { status: 'Optimal', color: '#22c55e' };
  };

  const getEcStatus = (ec) => {
    if (ec < 1.0) return { status: 'Too Weak', color: '#f59e0b' };
    if (ec > 2.5) return { status: 'Too Strong', color: '#ef4444' };
    return { status: 'Optimal', color: '#22c55e' };
  };

  const phStatus = getPhStatus(currentWeek.PH);
  const ecStatus = getEcStatus(currentWeek.EC);

  const totalNutrients = currentWeek.A + currentWeek.B + currentWeek.C;

  return (
    <Container
      onMouseEnter={() => showTooltip({
        type: 'feed',
        title: 'Automated Feeding',
        content: (
          <div>
            <p><strong>Nutrient Ratios:</strong></p>
            <ul>
              <li><strong>Grow Formula:</strong> Higher nitrogen for growth</li>
              <li><strong>Bloom Formula:</strong> Higher phosphorus/potassium for flowering</li>
              <li><strong>Micro nutrients:</strong> Essential trace elements</li>
            </ul>

            <p><strong>Feeding Schedule:</strong></p>
            <ul>
              <li>Feed every watering during growth</li>
              <li>Reduce feeding in final 1-2 weeks</li>
              <li>Flush with plain water before harvest</li>
            </ul>

            <p><strong>Safety:</strong> Always check pH after mixing nutrients!</p>
          </div>
        )
      })}
      onMouseLeave={hideTooltip}
    >
      <CardHeader>
        <CardTitle>
          <Droplets size={20} />
          Feeding Control
        </CardTitle>
        <ToggleGroup>
          <ModernToggle
            checked={currentWeek.feedControl}
            onChange={() => onToggleSwitch('feedControl')}
            onMouseEnter={() => showTooltip({
              type: 'control',
              title: 'Feed Control',
              content: (
                <div>
                  <p><strong>Automatic Feeding Control</strong></p>
                  <p>When enabled, the system will automatically manage nutrient delivery based on your feeding schedule and plant needs.</p>
                  <ul>
                    <li>• Monitors EC and pH levels</li>
                    <li>• Adjusts nutrient ratios automatically</li>
                    <li>• Prevents over/under feeding</li>
                  </ul>
                </div>
              )
            })}
            onMouseLeave={hideTooltip}
            label="Feed Control"
          />
        </ToggleGroup>
      </CardHeader>

      {currentWeek.feedControl && (
        <>
          <ParameterRow>
            <ParameterGroup
              onMouseEnter={() => showTooltip({
                type: 'ec',
                title: 'Electrical Conductivity (EC)',
                content: (
                  <div>
                    <p><strong>What is EC?</strong></p>
                    <p>Measures the total dissolved salts (nutrients) in your water solution.</p>

                    <p><strong>EC Ranges by Stage:</strong></p>
                    <ul>
                      <li><strong>Seedlings/Cuttings:</strong> 0.8-1.2</li>
                      <li><strong>Early Veg:</strong> 1.2-1.6</li>
                      <li><strong>Mid Veg:</strong> 1.6-2.0</li>
                      <li><strong>Flowering:</strong> 1.8-2.4</li>
                      <li><strong>Flush:</strong> 0.8-1.2</li>
                    </ul>

                    <p><strong>EC Management:</strong></p>
                    <ul>
                      <li>Increase gradually to avoid shock</li>
                      <li>Monitor runoff EC levels</li>
                      <li>pH affects nutrient availability</li>
                    </ul>
                  </div>
                )
              })}
              onMouseLeave={hideTooltip}
            >
              <ParameterLabel>
                EC Level
                <HelpCircle size={14} style={{ marginLeft: '0.5rem', opacity: 0.6, cursor: 'help' }} />
                <StatusIndicator color={ecStatus.color}>
                  {ecStatus.status}
                </StatusIndicator>
              </ParameterLabel>
              <NumberInput
                type="number"
                step="0.1"
                min="0.5"
                max="3.0"
                value={currentWeek.EC}
                onChange={(e) => handleEcChange(e.target.value)}
              />
            </ParameterGroup>

            <ParameterGroup
              onMouseEnter={() => showTooltip({
                type: 'ph',
                title: 'pH Level Management',
                content: (
                  <div>
                    <p><strong>Optimal pH Ranges:</strong></p>
                    <ul>
                      <li><strong>Soil:</strong> 6.0-7.0</li>
                      <li><strong>Hydroponics:</strong> 5.5-6.5</li>
                      <li><strong>Coco:</strong> 5.8-6.5</li>
                    </ul>

                    <p><strong>pH Effects:</strong></p>
                    <ul>
                      <li>Controls nutrient availability</li>
                      <li>Affects microbial activity</li>
                      <li>Prevents nutrient lockout</li>
                    </ul>

                    <p><strong>pH Problems:</strong></p>
                    <ul>
                      <li><strong>Too Low (Acidic):</strong> Iron, manganese toxicity</li>
                      <li><strong>Too High (Alkaline):</strong> Calcium, magnesium deficiency</li>
                    </ul>
                  </div>
                )
              })}
              onMouseLeave={hideTooltip}
            >
              <ParameterLabel>
                pH Level
                <HelpCircle size={14} style={{ marginLeft: '0.5rem', opacity: 0.6, cursor: 'help' }} />
                <StatusIndicator color={phStatus.color}>
                  {phStatus.status}
                </StatusIndicator>
              </ParameterLabel>
              <NumberInput
                type="number"
                step="0.1"
                min="4.0"
                max="8.0"
                value={currentWeek.PH}
                onChange={(e) => handlePhChange(e.target.value)}
              />
            </ParameterGroup>
          </ParameterRow>

          <NutrientGrid>
            <NutrientLabel>
              <NutrientName>Nutrient A</NutrientName>
              <NutrientInput
                type="number"
                min="0"
                max="50"
                value={currentWeek.A}
                onChange={(e) => handleNutrientChange('A', e.target.value)}
              />
              <NutrientUnit>ml</NutrientUnit>
            </NutrientLabel>

            <NutrientLabel>
              <NutrientName>Nutrient B</NutrientName>
              <NutrientInput
                type="number"
                min="0"
                max="50"
                value={currentWeek.B}
                onChange={(e) => handleNutrientChange('B', e.target.value)}
              />
              <NutrientUnit>ml</NutrientUnit>
            </NutrientLabel>

            <NutrientLabel>
              <NutrientName>Boost/Micronutrients</NutrientName>
              <NutrientInput
                type="number"
                min="0"
                max="50"
                value={currentWeek.C}
                onChange={(e) => handleNutrientChange('C', e.target.value)}
              />
              <NutrientUnit>ml</NutrientUnit>
            </NutrientLabel>
          </NutrientGrid>

          <SummarySection>
            <SummaryItem>
              <SummaryLabel>Total Nutrients:</SummaryLabel>
              <SummaryValue>{totalNutrients} ml</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Ratio:</SummaryLabel>
              <SummaryValue>{currentWeek.A}:{currentWeek.B}:{currentWeek.C}</SummaryValue>
            </SummaryItem>
          </SummarySection>

          <InfoSection>
            <InfoText>
              💧 Adjust nutrient ratios based on plant growth stage and deficiency symptoms
            </InfoText>
          <InfoText>
            <Scale size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Monitor EC levels regularly to prevent nutrient burn or deficiencies
          </InfoText>
          </InfoSection>
        </>
      )}
    </Container>
  );
};

export default FeedingManager;

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const CardTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #22c55e; // Feeding theme color
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ModernToggle = ({ checked, onChange, label }) => (
  <ToggleContainer onClick={onChange}>
    <ToggleSwitch checked={checked}>
      <ToggleKnob checked={checked} />
    </ToggleSwitch>
    <ToggleText>{label}</ToggleText>
  </ToggleContainer>
);

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${props => props.checked ? '#22c55e' : '#6b7280'};
  border-radius: 24px;
  transition: background-color 0.3s ease;
`;

const ToggleKnob = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.checked ? '22px' : '2px'};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s ease;
`;

const ToggleText = styled.span`
  font-size: 0.875rem;
  color: var(--main-text-color);
  opacity: 0.9;
`;

const ParameterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ParameterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ParameterLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-color);
  opacity: 0.9;
`;

const StatusIndicator = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.color};
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: ${props => props.color}20;
`;

const NumberInput = styled.input`
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
`;

const NutrientGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const NutrientLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const NutrientName = styled.span`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-color);
`;

const NutrientInput = styled.input`
  width: 60px;
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #22c55e;
  }
`;

const NutrientUnit = styled.span`
  font-size: 0.75rem;
  color: var(--main-text-muted);
  opacity: 0.8;
`;

const SummarySection = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SummaryLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--main-text-muted);
  opacity: 0.8;
`;

const SummaryValue = styled.span`
  font-size: 0.875rem;
  color: var(--main-text-color);
  font-weight: 600;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: var(--main-text-muted);
  opacity: 0.8;
  font-style: italic;
`;