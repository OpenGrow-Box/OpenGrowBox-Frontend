import React from 'react';
import styled from 'styled-components';
import { Thermometer, HelpCircle } from 'lucide-react';
import { useTooltip } from './TooltipContext';

const ClimateController = ({
  currentWeek,
  onUpdateWeek,
  onToggleSwitch
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const handleVpdChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0.1, Math.min(3.0, numValue));
    onUpdateWeek('vpd', clampedValue);
  };

  const handleTempChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(10, Math.min(35, numValue));
    onUpdateWeek('temperature', clampedValue);
  };

  const handleHumidityChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(20, Math.min(90, numValue));
    onUpdateWeek('humidity', clampedValue);
  };

  const handleCo2Change = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(200, Math.min(2000, numValue));
    onUpdateWeek('co2', clampedValue);
  };

  const getVpdStatus = (vpd) => {
    if (vpd < 0.8) return { status: 'Low', color: '#ef4444' };
    if (vpd > 1.5) return { status: 'High', color: '#f59e0b' };
    return { status: 'Optimal', color: '#22c55e' };
  };

  const getTempStatus = (temp) => {
    if (temp < 18) return { status: 'Cold', color: '#3b82f6' };
    if (temp > 28) return { status: 'Hot', color: '#ef4444' };
    return { status: 'Optimal', color: '#22c55e' };
  };

  const getHumidityStatus = (humidity) => {
    if (humidity < 40) return { status: 'Dry', color: '#f59e0b' };
    if (humidity > 70) return { status: 'Humid', color: '#3b82f6' };
    return { status: 'Optimal', color: '#22c55e' };
  };

  const vpdStatus = getVpdStatus(currentWeek.vpd);
  const tempStatus = getTempStatus(currentWeek.temperature);
  const humidityStatus = getHumidityStatus(currentWeek.humidity);

  return (
    <Container>
      <CardHeader>
        <CardTitle>
          <Thermometer size={20} />
          Climate Control
        </CardTitle>
        <ToggleGroup>
          <ModernToggle
            checked={currentWeek.FullAutomatic}
            onChange={() => onToggleSwitch('FullAutomatic')}
            onMouseEnter={() => showTooltip({
              type: 'control',
              title: 'Full Automatic Mode',
              content: (
                <div>
                  <p><strong>Complete Climate Automation</strong></p>
                  <p>Enables full automatic control of temperature, humidity, VPD, and CO₂ for optimal growing conditions.</p>
                  <ul>
                    <li>• Maintains ideal VPD ranges</li>
                    <li>• Automatic climate adjustments</li>
                    <li>• 24/7 environmental monitoring</li>
                  </ul>
                </div>
              )
            })}
            onMouseLeave={hideTooltip}
            label="OGB Control"
          />
          <ModernToggle
            checked={currentWeek.nightVPDHold}
            onChange={() => onToggleSwitch('nightVPDHold')}
            onMouseEnter={() => showTooltip({
              type: 'vpd',
              title: 'Night VPD Hold',
              content: (
                <div>
                  <p><strong>Nighttime VPD Maintenance</strong></p>
                  <p>Prevents VPD from dropping too low during dark periods when plants are not transpiring.</p>
                  <ul>
                    <li>• Maintains minimum VPD levels</li>
                    <li>• Prevents humidity spikes</li>
                    <li>• Protects plant health overnight</li>
                  </ul>
                </div>
              )
            })}
            onMouseLeave={hideTooltip}
            label="Night VPD"
          />
          <ModernToggle
            checked={currentWeek.co2Control}
            onChange={() => onToggleSwitch('co2Control')}
            onMouseEnter={() => showTooltip({
              type: 'co2',
              title: 'CO₂ Control',
              content: (
                <div>
                  <p><strong>Carbon Dioxide Enrichment</strong></p>
                  <p>Automatically maintains optimal CO₂ levels for enhanced photosynthesis and growth.</p>
                  <ul>
                    <li>• Boosts growth rates by 20-30%</li>
                    <li>• Maintains 800-1500 ppm levels</li>
                    <li>• Energy-efficient CO₂ injection</li>
                  </ul>
                </div>
              )
            })}
            onMouseLeave={hideTooltip}
            label="CO₂ Control"
          />
        </ToggleGroup>
      </CardHeader>

      <ParameterRow>
        <ParameterGroup
          onMouseEnter={() => showTooltip({
            type: 'vpd',
            title: 'Vapor Pressure Deficit (VPD)',
            content: (
              <div>
                <p><strong>What is VPD?</strong></p>
                <p>The difference between the amount of moisture in the air and how much moisture the air can hold at a given temperature.</p>

                <p><strong>Why it matters:</strong></p>
                <ul>
                  <li>Controls transpiration rate</li>
                  <li>Prevents mold and mildew</li>
                  <li>Optimizes nutrient uptake</li>
                </ul>

                <p><strong>Optimal Ranges:</strong></p>
                <ul>
                  <li><span style={{color: '#22c55e'}}>● 0.8-1.5 kPa</span> - Optimal growth</li>
                  <li><span style={{color: '#f59e0b'}}>● 0.4-0.8 kPa</span> - Slower growth</li>
                  <li><span style={{color: '#ef4444'}}>● &lt;0.4 or &gt;1.5 kPa</span> - Stress conditions</li>
                </ul>
              </div>
            )
          })}
          onMouseLeave={hideTooltip}
        >
          <ParameterLabel>
            VPD Target
            <HelpCircle size={14} style={{ marginLeft: '0.5rem', opacity: 0.6, cursor: 'help' }} />
            <StatusIndicator color={vpdStatus.color}>
              {vpdStatus.status}
            </StatusIndicator>
          </ParameterLabel>
          <InputWithSuffix>
            <NumberInput
              type="number"
              step="0.1"
              min="0.1"
              max="3.0"
              value={currentWeek.vpd}
              onChange={(e) => handleVpdChange(e.target.value)}
            />
            <InputSuffix>kPa</InputSuffix>
          </InputWithSuffix>
        </ParameterGroup>

        <ParameterGroup
          onMouseEnter={() => showTooltip({
            type: 'temperature',
            title: 'Temperature Control',
            content: (
              <div>
                <p><strong>Optimal Temperature Ranges:</strong></p>
                <ul>
                  <li><strong>Germination:</strong> 20-24°C</li>
                  <li><strong>Vegetative:</strong> 20-26°C</li>
                  <li><strong>Flowering:</strong> 20-28°C</li>
                </ul>

                <p><strong>Temperature Effects:</strong></p>
                <ul>
                  <li>Too cold: Slow growth, nutrient lockout</li>
                  <li>Too hot: Stress, reduced yields, pest issues</li>
                  <li>Fluctuations: Hermaphroditism risk</li>
                </ul>

                <p><strong>Tip:</strong> Maintain ±2°C consistency for best results.</p>
              </div>
            )
          })}
          onMouseLeave={hideTooltip}
        >
          <ParameterLabel>
            Temperature
            <HelpCircle size={14} style={{ marginLeft: '0.5rem', opacity: 0.6, cursor: 'help' }} />
            <StatusIndicator color={tempStatus.color}>
              {tempStatus.status}
            </StatusIndicator>
          </ParameterLabel>
          <InputWithSuffix>
            <NumberInput
              type="number"
              step="0.5"
              min="10"
              max="35"
              value={currentWeek.temperature}
              onChange={(e) => handleTempChange(e.target.value)}
            />
            <InputSuffix>°C</InputSuffix>
          </InputWithSuffix>
        </ParameterGroup>

        <ParameterGroup
          onMouseEnter={() => showTooltip({
            type: 'humidity',
            title: 'Humidity Control',
            content: (
              <div>
                <p><strong>Humidity Stages:</strong></p>
                <ul>
                  <li><strong>Germination:</strong> 70-80%</li>
                  <li><strong>Cuttings/Clones:</strong> 70-80%</li>
                  <li><strong>Vegetative:</strong> 50-70%</li>
                  <li><strong>Flowering:</strong> 40-50%</li>
                  <li><strong>Final Weeks:</strong> 30-40%</li>
                </ul>

                <p><strong>Why Control Humidity?</strong></p>
                <ul>
                  <li>Prevents mold and mildew</li>
                  <li>Controls transpiration rate</li>
                  <li>Affects nutrient absorption</li>
                  <li>Reduces pest pressure</li>
                </ul>
              </div>
            )
          })}
          onMouseLeave={hideTooltip}
        >
          <ParameterLabel>
            Humidity
            <HelpCircle size={14} style={{ marginLeft: '0.5rem', opacity: 0.6, cursor: 'help' }} />
            <StatusIndicator color={humidityStatus.color}>
              {humidityStatus.status}
            </StatusIndicator>
          </ParameterLabel>
          <InputWithSuffix>
            <NumberInput
              type="number"
              step="1"
              min="20"
              max="90"
              value={currentWeek.humidity}
              onChange={(e) => handleHumidityChange(e.target.value)}
            />
            <InputSuffix>%</InputSuffix>
          </InputWithSuffix>
        </ParameterGroup>

        <ParameterGroup
          onMouseEnter={() => showTooltip({
            type: 'co2',
            title: 'CO₂ Enrichment',
            content: (
              <div>
                <p><strong>CO₂ Levels:</strong></p>
                <ul>
                  <li><strong>Ambient Air:</strong> ~400 ppm</li>
                  <li><strong>Optimal Growth:</strong> 800-1500 ppm</li>
                  <li><strong>Maximum Safe:</strong> 2000 ppm</li>
                </ul>

                <p><strong>Benefits:</strong></p>
                <ul>
                  <li>Increases photosynthesis rate</li>
                  <li>Faster growth and higher yields</li>
                  <li>More efficient light utilization</li>
                </ul>

                <p><strong>Important Notes:</strong></p>
                <ul>
                  <li>Requires good ventilation</li>
                  <li>Monitor for CO₂ toxicity</li>
                  <li>Only effective with adequate light</li>
                </ul>
              </div>
            )
          })}
          onMouseLeave={hideTooltip}
        >
          <ParameterLabel>
            CO₂ Level
            <HelpCircle size={14} style={{ marginLeft: '0.5rem', opacity: 0.6, cursor: 'help' }} />
          </ParameterLabel>
          <InputWithSuffix>
            <NumberInput
              type="number"
              step="50"
              min="200"
              max="2000"
              value={currentWeek.co2}
              onChange={(e) => handleCo2Change(e.target.value)}
            />
            <InputSuffix>ppm</InputSuffix>
          </InputWithSuffix>
        </ParameterGroup>
      </ParameterRow>

      <InfoSection>
        <InfoItem>
          <InfoLabel>VPD Range:</InfoLabel>
          <InfoValue>0.8-1.5 kPa (Optimal)</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Temp Range:</InfoLabel>
          <InfoValue>18-28°C (Optimal)</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Humidity Range:</InfoLabel>
          <InfoValue>40-70% (Optimal)</InfoValue>
        </InfoItem>
      </InfoSection>
    </Container>
  );
};

export default ClimateController;

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
  color: #3b82f6; // Climate theme color
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
  border-radius: 0.375rem 0 0 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.875rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #3b82f6;
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

const InfoSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--main-text-muted);
  opacity: 0.8;
`;

const InfoValue = styled.span`
  font-size: 0.875rem;
  color: var(--main-text-color);
  font-weight: 500;
`;