import React from 'react';
import styled from 'styled-components';
import { Zap, HelpCircle, Lightbulb } from 'lucide-react';
import { useTooltip } from './TooltipContext';

const LightScheduler = ({
  currentWeek,
  onUpdateWeek,
  onToggleSwitch
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const handleTimeChange = (field, value) => {
    onUpdateWeek(field, value);
  };

  const handleIntensityChange = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));
    onUpdateWeek('lightIntensity', clampedValue);
  };

  const handleDimmTimeChange = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(120, numValue)); // Max 2 hours
    onUpdateWeek('lightDimmTime', clampedValue);
  };

  return (
    <Container
      onMouseEnter={() => showTooltip({
        type: 'light',
        title: 'Light Scheduling',
        content: (
          <div>
            <p><strong>Light Cycle Basics:</strong></p>
            <ul>
              <li><strong>18/6:</strong> Vegetative growth</li>
              <li><strong>12/12:</strong> Flowering/fruiting</li>
              <li><strong>24/0:</strong> Maximum vegetative growth</li>
            </ul>

            <p><strong>Sun Phase Feature:</strong></p>
            <p>Gradually increases/decreases light intensity to simulate natural sunrise/sunset, reducing stress on plants.</p>

            <p><strong>Dimmable Lights:</strong></p>
            <p>Automatically adjust intensity based on your schedule, providing optimal light levels throughout the day.</p>
          </div>
        )
      })}
      onMouseLeave={hideTooltip}
    >
      <CardHeader>
        <CardTitle>
          <Zap size={20} />
          Light Schedule
        </CardTitle>
        <ToggleGroup>
          <ModernToggle
            checked={currentWeek.isDimmable}
            onChange={() => onToggleSwitch('isDimmable')}
            onMouseEnter={() => showTooltip({
              type: 'light',
              title: 'Dimmable Lights',
              content: (
                <div>
                  <p><strong>Light Intensity Control</strong></p>
                  <p>Enables smooth dimming of lights for gradual intensity changes and sunrise/sunset simulations.</p>
                  <ul>
                    <li>• Smooth light transitions</li>
                    <li>• Mimics natural light cycles</li>
                    <li>• Reduces plant stress</li>
                  </ul>
                </div>
              )
            })}
            onMouseLeave={hideTooltip}
            label="Dimmable"
          />
          <ModernToggle
            checked={currentWeek.sunPhases}
            onChange={() => onToggleSwitch('sunPhases')}
            onMouseEnter={() => showTooltip({
              type: 'light',
              title: 'Sun Phases Simulation',
              content: (
                <div>
                  <p><strong>Natural Light Cycle Simulation</strong></p>
                  <p>Simulates sunrise and sunset by gradually changing light intensity, mimicking natural conditions.</p>
                  <ul>
                    <li>• Reduces transplant shock</li>
                    <li>• Improves plant circadian rhythms</li>
                    <li>• Creates more natural growth patterns</li>
                  </ul>
                </div>
              )
            })}
            onMouseLeave={hideTooltip}
            label="Sun Phases"
          />
        </ToggleGroup>
      </CardHeader>

      <ParameterRow>
        <ParameterGroup>
          <ParameterLabel>Start Time</ParameterLabel>
          <TimeInput
            type="time"
            value={currentWeek.lightStart}
            onChange={(e) => handleTimeChange('lightStart', e.target.value)}
          />
        </ParameterGroup>

        <ParameterGroup>
          <ParameterLabel>End Time</ParameterLabel>
          <TimeInput
            type="time"
            value={currentWeek.lightEnd}
            onChange={(e) => handleTimeChange('lightEnd', e.target.value)}
          />
        </ParameterGroup>

        <ParameterGroup>
          <ParameterLabel>Intensity</ParameterLabel>
          <InputWithSuffix>
            <NumberInput
              type="number"
              min="0"
              max="100"
              value={currentWeek.lightIntensity}
              onChange={(e) => handleIntensityChange(e.target.value)}
            />
            <InputSuffix>%</InputSuffix>
          </InputWithSuffix>
        </ParameterGroup>

        {currentWeek.sunPhases && (
          <ParameterGroup>
            <ParameterLabel>Sun Phase Duration</ParameterLabel>
            <InputWithSuffix>
              <NumberInput
                type="number"
                min="0"
                max="120"
                value={currentWeek.lightDimmTime}
                onChange={(e) => handleDimmTimeChange(e.target.value)}
              />
              <InputSuffix>min</InputSuffix>
            </InputWithSuffix>
          </ParameterGroup>
        )}
      </ParameterRow>

      {currentWeek.isDimmable && (
        <InfoText>
        <Lightbulb size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
        Dimmable lights will gradually adjust intensity during sun phases
      </InfoText>
      )}
    </Container>
  );
};

export default LightScheduler;

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
  color: #fbbf24; // Light theme color
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
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-color);
  opacity: 0.9;
`;

const TimeInput = styled.input`
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #fbbf24;
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
  }
`;

const NumberInput = styled.input`
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem 0 0 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #fbbf24;
  }
`;

const InputWithSuffix = styled.div`
  display: flex;
  align-items: center;
`;

const InputSuffix = styled.span`
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-left: none;
  border-radius: 0 0.375rem 0.375rem 0;
  color: var(--main-text-color);
  font-size: 0.875rem;
  opacity: 0.8;
`;

const InfoText = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: var(--main-text-muted);
  opacity: 0.8;
  font-style: italic;
`;